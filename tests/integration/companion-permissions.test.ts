import { afterEach, describe, expect, it, vi } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { api, internal } from "../../convex/_generated/api";

const modules = import.meta.glob("../../convex/**/*.{ts,js}");
afterEach(() => vi.useRealTimers());

async function fixture() {
  const t = convexTest(schema, modules);
  const alice = t.withIdentity({ subject: "companion-alice", email: "companion-a@example.com", emailVerified: true });
  const bob = t.withIdentity({ subject: "companion-bob", email: "companion-b@example.com", emailVerified: true });
  const carla = t.withIdentity({ subject: "companion-carla", email: "companion-c@example.com", emailVerified: true });
  const outsider = t.withIdentity({ subject: "companion-outsider", email: "companion-o@example.com", emailVerified: true });
  const aliceId = await alice.mutation(api.profiles.ensureMine, {});
  const bobId = await bob.mutation(api.profiles.ensureMine, {});
  const carlaId = await carla.mutation(api.profiles.ensureMine, {});
  await outsider.mutation(api.profiles.ensureMine, {});
  const [directConnection, carlaConnection] = await Promise.all([
    t.run(ctx => ctx.db.insert("connections", {
      leftProfileId: aliceId, rightProfileId: bobId, createdBy: aliceId, createdAt: Date.now(),
    })),
    t.run(ctx => ctx.db.insert("connections", {
      leftProfileId: aliceId, rightProfileId: carlaId, createdBy: aliceId, createdAt: Date.now(),
    })),
  ]);
  const direct = await alice.mutation(api.conversations.openDirect, { connectionId: directConnection });
  const companionId = await alice.mutation(api.companions.createMine, {
    handle: "Milo", displayName: "Milo",
  });
  return { t, alice, bob, carla, outsider, aliceId, bobId, carlaId, direct, companionId, carlaConnection };
}

async function consentDirect(f: Awaited<ReturnType<typeof fixture>>) {
  const args = { companionId: f.companionId, conversationId: f.direct, granted: true };
  await f.alice.mutation(api.companions.setConsent, args);
  await f.bob.mutation(api.companions.setConsent, args);
}

async function mention(f: Awaited<ReturnType<typeof fixture>>, body = "@milo help with this") {
  return f.alice.mutation(api.messages.send, {
    conversationId: f.direct, body,
    clientNonce: "companion-message-" + Math.random().toString(36).slice(2).padEnd(18, "0"),
  });
}

function nonce(n: string) {
  return "companion-invoke-" + n.padStart(16, "0");
}

describe("Companion authorization contracts (no AI provider)", () => {
  it("isolates companion ownership and requires a verified active account", async () => {
    const f = await fixture();
    const [a] = await f.alice.query(api.companions.listMine, {});
    expect(a?._id).toBe(f.companionId);
    expect(await f.bob.query(api.companions.listMine, {})).toEqual([]);
    expect(await f.alice.mutation(api.companions.createMine, { handle: "MILO", displayName: "Milo" }))
      .toBe(f.companionId);
    await expect(f.bob.mutation(api.companions.setEnabled, {
      companionId: f.companionId, enabled: false,
    })).rejects.toThrow();
    await expect(f.outsider.mutation(api.companions.setConsent, {
      companionId: f.companionId, conversationId: f.direct, granted: true,
    })).rejects.toThrow();
    const unverified = f.t.withIdentity({
      subject: "companion-alice", email: "companion-a@example.com", emailVerified: false,
    });
    await expect(unverified.query(api.companions.listMine, {})).rejects.toThrow();
    await expect(unverified.mutation(api.companions.createMine, {
      handle: "secret", displayName: "Secret",
    })).rejects.toThrow();
  });

  it("requires EVERY current DM participant's consent; requester's own companion only", async () => {
    const f = await fixture();
    const sourceMessageId = await mention(f);
    const args = { companionId: f.companionId, conversationId: f.direct, sourceMessageId, clientNonce: nonce("1") };
    await expect(f.alice.mutation(api.companionInvocations.request, args)).rejects.toThrow();
    await f.alice.mutation(api.companions.setConsent, {
      companionId: f.companionId, conversationId: f.direct, granted: true,
    });
    const pending = await f.alice.query(api.companions.consentStatus, {
      companionId: f.companionId, conversationId: f.direct,
    });
    expect(pending).toMatchObject({ grantedMembers: 1, totalMembers: 2, canInvoke: false });
    await expect(f.alice.mutation(api.companionInvocations.request, args)).rejects.toThrow();
    await f.bob.mutation(api.companions.setConsent, {
      companionId: f.companionId, conversationId: f.direct, granted: true,
    });
    expect((await f.bob.query(api.companions.consentStatus, {
      companionId: f.companionId, conversationId: f.direct,
    })).canInvoke).toBe(false);
    const id = await f.alice.mutation(api.companionInvocations.request, args);
    expect(await f.alice.mutation(api.companionInvocations.request, args)).toBe(id);
    expect(await f.t.query(internal.companionInvocations.contextForDispatch, { invocationId: id }))
      .toMatchObject({ text: "@milo help with this", requesterProfileId: f.aliceId });
    expect(await f.bob.query(api.companionInvocations.listMine, {})).toEqual([]);
    expect(await f.alice.query(api.companionInvocations.listMine, {}))
      .toMatchObject([{ invocationId: id, status: "validated" }]);
    await expect(f.bob.mutation(api.companionInvocations.request, {
      ...args, clientNonce: nonce("2"),
    })).rejects.toThrow();
    await expect(f.outsider.mutation(api.companionInvocations.request, {
      ...args, clientNonce: nonce("3"),
    })).rejects.toThrow();
  });

  it("does not leak other chat history or message text through public status", async () => {
    const f = await fixture();
    await f.alice.mutation(api.messages.send, {
      conversationId: f.direct, body: "PRIVATE HISTORY NEVER TO MODEL", clientNonce: "private-history-message-01",
    });
    await consentDirect(f);
    const sourceMessageId = await mention(f, "@Milo please summarize only this sentence");
    const id = await f.alice.mutation(api.companionInvocations.request, {
      conversationId: f.direct, companionId: f.companionId, sourceMessageId, clientNonce: nonce("4"),
    });
    const context = await f.t.query(internal.companionInvocations.contextForDispatch, { invocationId: id });
    expect(context?.text).toBe("@Milo please summarize only this sentence");
    expect(JSON.stringify(context)).not.toContain("PRIVATE HISTORY");
    expect(JSON.stringify(await f.alice.query(api.companionInvocations.listMine, {}))).not.toContain("summarize");
    expect(JSON.stringify(await f.bob.query(api.companions.consentStatus, {
      companionId: f.companionId, conversationId: f.direct,
    }))).not.toContain("PRIVATE HISTORY");
  });

  it("invalidates a validated request after consent is revoked and does not restore it on re-consent", async () => {
    const f = await fixture();
    await consentDirect(f);
    const sourceMessageId = await mention(f);
    const id = await f.alice.mutation(api.companionInvocations.request, {
      conversationId: f.direct, companionId: f.companionId, sourceMessageId, clientNonce: nonce("5"),
    });
    await f.bob.mutation(api.companions.setConsent, {
      conversationId: f.direct, companionId: f.companionId, granted: false,
    });
    expect(await f.t.query(internal.companionInvocations.contextForDispatch, { invocationId: id })).toBeNull();
    await f.bob.mutation(api.companions.setConsent, {
      conversationId: f.direct, companionId: f.companionId, granted: true,
    });
    expect(await f.t.query(internal.companionInvocations.contextForDispatch, { invocationId: id })).toBeNull();
    // The old nonce maps to its old immutable invocation; a new one is required.
    const newer = await f.alice.mutation(api.companionInvocations.request, {
      conversationId: f.direct, companionId: f.companionId, sourceMessageId, clientNonce: nonce("6"),
    });
    expect(newer).not.toBe(id);
    expect(await f.t.query(internal.companionInvocations.contextForDispatch, { invocationId: newer }))
      .not.toBeNull();
  });

  it("invalidates context after a DM block, source edit/delete, or owner disabling companion", async () => {
    const f = await fixture();
    await consentDirect(f);
    const msg = await mention(f);
    const id = await f.alice.mutation(api.companionInvocations.request, {
      conversationId: f.direct, companionId: f.companionId, sourceMessageId: msg, clientNonce: nonce("7"),
    });
    await f.t.run(ctx => ctx.db.insert("blocks", {
      blockerProfileId: f.bobId, blockedProfileId: f.aliceId, createdAt: Date.now(),
    }));
    expect(await f.t.query(internal.companionInvocations.contextForDispatch, { invocationId: id })).toBeNull();
    await f.t.run(async ctx => {
      const block = await ctx.db.query("blocks")
        .withIndex("by_pair", q => q.eq("blockerProfileId", f.bobId).eq("blockedProfileId", f.aliceId)).unique();
      if (block) await ctx.db.delete(block._id);
    });
    await f.alice.mutation(api.messages.edit, { messageId: msg, body: "@milo revised text" });
    expect(await f.t.query(internal.companionInvocations.contextForDispatch, { invocationId: id })).toBeNull();
    const anotherMessage = await mention(f, "@milo new request");
    const second = await f.alice.mutation(api.companionInvocations.request, {
      conversationId: f.direct, companionId: f.companionId, sourceMessageId: anotherMessage,
      clientNonce: nonce("8"),
    });
    await f.alice.mutation(api.messages.remove, { messageId: anotherMessage });
    expect(await f.t.query(internal.companionInvocations.contextForDispatch, { invocationId: second })).toBeNull();
    const thirdMessage = await mention(f, "@milo last request");
    const third = await f.alice.mutation(api.companionInvocations.request, {
      conversationId: f.direct, companionId: f.companionId, sourceMessageId: thirdMessage,
      clientNonce: nonce("9"),
    });
    await f.alice.mutation(api.companions.setEnabled, { companionId: f.companionId, enabled: false });
    expect(await f.t.query(internal.companionInvocations.contextForDispatch, { invocationId: third })).toBeNull();
    await f.alice.mutation(api.companions.setEnabled, { companionId: f.companionId, enabled: true });
    expect(await f.t.query(internal.companionInvocations.contextForDispatch, { invocationId: third })).toBeNull();
  });

  it("refuses forged, other-conversation, non-owner, and post-cancel requests", async () => {
    const f = await fixture();
    await consentDirect(f);
    const normal = await f.alice.mutation(api.messages.send, {
      conversationId: f.direct, body: "This is not a mention", clientNonce: "not-a-mention-message-1",
    });
    await expect(f.alice.mutation(api.companionInvocations.request, {
      conversationId: f.direct, companionId: f.companionId, sourceMessageId: normal,
      clientNonce: nonce("10"),
    })).rejects.toThrow();
    const msg = await mention(f);
    const foreign = await f.alice.mutation(api.groups.create, { name: "Other group" });
    await expect(f.alice.mutation(api.companionInvocations.request, {
      conversationId: foreign, companionId: f.companionId, sourceMessageId: msg,
      clientNonce: nonce("11"),
    })).rejects.toThrow();
    const args = { conversationId: f.direct, companionId: f.companionId, sourceMessageId: msg, clientNonce: nonce("12") };
    const id = await f.alice.mutation(api.companionInvocations.request, args);
    await expect(f.bob.mutation(api.companionInvocations.cancel, { invocationId: id })).rejects.toThrow();
    await f.alice.mutation(api.companionInvocations.cancel, { invocationId: id });
    await f.alice.mutation(api.companionInvocations.cancel, { invocationId: id });
    expect(await f.t.query(internal.companionInvocations.contextForDispatch, { invocationId: id })).toBeNull();
    await expect(f.alice.mutation(api.companionInvocations.request, {
      ...args, clientNonce: nonce("13"), sourceMessageId: normal,
    })).rejects.toThrow();
    await expect(f.alice.mutation(api.companionInvocations.request, {
      ...args, clientNonce: nonce("12"), sourceMessageId: normal,
    })).rejects.toThrow();
  });

  it("requires all current GROUP members and denies pre-join context and outsider consent", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-07T10:00:00Z"));
    const f = await fixture();
    const group = await f.alice.mutation(api.groups.create, { name: "Cozy circle" });
    const old = await f.alice.mutation(api.messages.send, {
      conversationId: group, body: "@milo message before join", clientNonce: "group-before-milo-0001",
    });
    const consent = { companionId: f.companionId, conversationId: group, granted: true };
    await f.alice.mutation(api.companions.setConsent, consent);
    const invite = await f.alice.mutation(api.groups.inviteMember, { conversationId: group, profileId: f.bobId });
    vi.setSystemTime(new Date("2026-11-07T10:00:02Z"));
    await f.bob.mutation(api.groups.acceptInvite, { inviteId: invite });
    await expect(f.alice.mutation(api.companionInvocations.request, {
      conversationId: group, companionId: f.companionId, sourceMessageId: old, clientNonce: nonce("14"),
    })).rejects.toThrow(); // New participant hasn't consented; no history should be shared.
    await expect(f.outsider.mutation(api.companions.setConsent, consent)).rejects.toThrow();
    await f.bob.mutation(api.companions.setConsent, consent);
    // Consent after joining does not expose a message written before the join.
    await expect(f.alice.mutation(api.companionInvocations.request, {
      conversationId: group, companionId: f.companionId, sourceMessageId: old, clientNonce: nonce("14"),
    })).rejects.toThrow();
    const current = await f.alice.mutation(api.messages.send, {
      conversationId: group, body: "@milo hello after join", clientNonce: "group-after-milo-0001",
    });
    const invocationId = await f.alice.mutation(api.companionInvocations.request, {
      conversationId: group, companionId: f.companionId, sourceMessageId: current, clientNonce: nonce("15"),
    });
    expect(await f.t.query(internal.companionInvocations.contextForDispatch, { invocationId }))
      .toMatchObject({ text: "@milo hello after join" });
    // A third member immediately voids prior authorization until they opt in;
    // even if they later consent, old invocation snapshots remain invalid.
    const invited = await f.alice.mutation(api.groups.inviteMember, { conversationId: group, profileId: f.carlaId });
    vi.setSystemTime(new Date("2026-11-07T10:00:04Z"));
    await f.carla.mutation(api.groups.acceptInvite, { inviteId: invited });
    expect(await f.t.query(internal.companionInvocations.contextForDispatch, { invocationId })).toBeNull();
    await f.carla.mutation(api.companions.setConsent, consent);
    expect(await f.t.query(internal.companionInvocations.contextForDispatch, { invocationId })).toBeNull();
    const latestMsg = await f.alice.mutation(api.messages.send, {
      conversationId: group, body: "@milo another task", clientNonce: "group-latest-milo-001",
    });
    const latest = await f.alice.mutation(api.companionInvocations.request, {
      conversationId: group, companionId: f.companionId, sourceMessageId: latestMsg, clientNonce: nonce("16"),
    });
    expect(await f.t.query(internal.companionInvocations.contextForDispatch, { invocationId: latest }))
      .not.toBeNull();
    // Rejoining a group never silently restores the previous consent row.
    await f.alice.mutation(api.groups.removeMember, { conversationId: group, profileId: f.bobId });
    expect(await f.t.query(internal.companionInvocations.contextForDispatch, { invocationId: latest })).toBeNull();
    const nextInvite = await f.alice.mutation(api.groups.inviteMember, { conversationId: group, profileId: f.bobId });
    vi.setSystemTime(new Date("2026-11-07T10:00:06Z"));
    await f.bob.mutation(api.groups.acceptInvite, { inviteId: nextInvite });
    expect((await f.alice.query(api.companions.consentStatus, {
      companionId: f.companionId, conversationId: group,
    })).canInvoke).toBe(false);
  });
});
