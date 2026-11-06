import { afterEach, describe, expect, it, vi } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

const modules = import.meta.glob("../../convex/**/*.{ts,js}");
afterEach(() => vi.useRealTimers());

async function fixture() {
  const t = convexTest(schema, modules);
  const alice = t.withIdentity({ subject: "presence-alice", email: "presence-a@example.com", emailVerified: true });
  const bob = t.withIdentity({ subject: "presence-bob", email: "presence-b@example.com", emailVerified: true });
  const outsider = t.withIdentity({ subject: "presence-outsider", email: "presence-c@example.com", emailVerified: true });
  const [aliceId, bobId] = await Promise.all([
    alice.mutation(api.profiles.ensureMine, {}),
    bob.mutation(api.profiles.ensureMine, {}),
    outsider.mutation(api.profiles.ensureMine, {}),
  ]);
  const connectionId = await t.run(ctx => ctx.db.insert("connections", {
    leftProfileId: aliceId, rightProfileId: bobId, createdBy: aliceId, createdAt: Date.now(),
  }));
  const conversationId = await alice.mutation(api.conversations.openDirect, { connectionId });
  return { t, alice, bob, outsider, aliceId, bobId, conversationId };
}

const signal = (conversationId: Id<"conversations">) => ({
  conversationId, refreshToken: 1,
});

const presence = (patch: Partial<{
  onlineStatus: boolean; lastSeen: boolean; readReceipts: boolean; typingIndicators: boolean;
}> = {}) => ({
  onlineStatus: true, lastSeen: true, readReceipts: true, typingIndicators: true, ...patch,
});

describe("privacy-enforced private presence, typing and read acknowledgements", () => {
  it("scopes every signal and mutation to authenticated conversation participants", async () => {
    const { t, alice, outsider, conversationId } = await fixture();
    await alice.mutation(api.activity.heartbeat, {});
    await expect(outsider.query(api.activity.getConversationSignals, signal(conversationId))).rejects.toThrow();
    await expect(outsider.mutation(api.activity.setTyping, { conversationId, isTyping: true })).rejects.toThrow();
    const msgId = await alice.mutation(api.messages.send, {
      conversationId, body: "Private", clientNonce: "privacy-message-nonce-01",
    });
    await expect(outsider.mutation(api.activity.markRead, { conversationId, messageId: msgId })).rejects.toThrow();
    const unauthenticated = t.withIdentity({ subject: "presence-bob", email: "presence-b@example.com", emailVerified: false });
    await expect(unauthenticated.query(api.activity.getConversationSignals, signal(conversationId))).rejects.toThrow();
  });

  it("expires presence after missed heartbeats and supports independent online vs last-seen privacy", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-04T08:00:00.000Z"));
    const { alice, bob, conversationId } = await fixture();
    await alice.mutation(api.activity.heartbeat, {});
    const first = await bob.query(api.activity.getConversationSignals, signal(conversationId));
    expect(first.peerOnline).toBe(true);
    expect(first.peerLastSeenAt).toBe(Date.now());
    await alice.mutation(api.profiles.updatePresencePreferences, presence({ onlineStatus: false }));
    const invisible = await bob.query(api.activity.getConversationSignals, signal(conversationId));
    expect(invisible.peerOnline).toBeNull();
    expect(invisible.peerLastSeenAt).toBe(Date.now());
    await alice.mutation(api.profiles.updatePresencePreferences, presence({ onlineStatus: false, lastSeen: false }));
    await alice.mutation(api.activity.heartbeat, {});
    const hidden = await bob.query(api.activity.getConversationSignals, signal(conversationId));
    expect(hidden.peerOnline).toBeNull();
    expect(hidden.peerLastSeenAt).toBeNull();
    await alice.mutation(api.profiles.updatePresencePreferences, presence());
    vi.setSystemTime(new Date("2026-11-04T08:01:16.000Z"));
    const stale = await bob.query(api.activity.getConversationSignals, signal(conversationId));
    expect(stale.peerOnline).toBe(false);
    expect(stale.peerLastSeenAt).toBeLessThan(Date.now());
    await alice.mutation(api.activity.heartbeat, {});
    expect((await bob.query(api.activity.getConversationSignals, signal(conversationId))).peerOnline).toBe(true);
  });

  it("expires typing, stops it explicitly, and hides it when independently disabled", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-04T09:00:00.000Z"));
    const { t, alice, bob, conversationId } = await fixture();
    await alice.mutation(api.activity.setTyping, { conversationId, isTyping: true });
    expect((await bob.query(api.activity.getConversationSignals, signal(conversationId))).typing).toMatchObject([
      { displayName: "presence a" },
    ]);
    await alice.mutation(api.activity.setTyping, { conversationId, isTyping: true });
    expect(await t.run(ctx => ctx.db.query("typingStates").collect())).toHaveLength(1);
    vi.setSystemTime(new Date("2026-11-04T09:00:08.000Z"));
    expect((await bob.query(api.activity.getConversationSignals, signal(conversationId))).typing).toEqual([]);
    await alice.mutation(api.activity.setTyping, { conversationId, isTyping: true });
    await alice.mutation(api.profiles.updatePresencePreferences, presence({ typingIndicators: false }));
    expect((await bob.query(api.activity.getConversationSignals, signal(conversationId))).typing).toEqual([]);
    await alice.mutation(api.activity.setTyping, { conversationId, isTyping: false });
    expect(await t.run(ctx => ctx.db.query("typingStates").collect())).toEqual([]);
  });

  it("records only valid monotonic reads, and opt-out hides past read pointers immediately", async () => {
    const { t, alice, bob, conversationId } = await fixture();
    const first = await alice.mutation(api.messages.send, {
      conversationId, body: "One", clientNonce: "read-nonce-00000000001",
    });
    const second = await alice.mutation(api.messages.send, {
      conversationId, body: "Two", clientNonce: "read-nonce-00000000002",
    });
    await bob.mutation(api.activity.markRead, { conversationId, messageId: second });
    await bob.mutation(api.activity.markRead, { conversationId, messageId: first });
    const expected = (await t.run(ctx => ctx.db.query("messages").get(second)))?.createdAt;
    expect((await alice.query(api.activity.getConversationSignals, signal(conversationId))).readBy)
      .toMatchObject([{ readThroughAt: expected }]);
    await bob.mutation(api.profiles.updatePresencePreferences, presence({ readReceipts: false }));
    expect((await alice.query(api.activity.getConversationSignals, signal(conversationId))).readBy).toEqual([]);
    await bob.mutation(api.activity.markRead, { conversationId, messageId: first });
    await alice.mutation(api.profiles.updatePresencePreferences, presence({ readReceipts: false }));
    expect((await bob.query(api.activity.getConversationSignals, signal(conversationId))).readBy).toEqual([]);
    expect(await t.run(ctx => ctx.db.query("conversationMembers").collect())).toHaveLength(2);
  });

  it("rejects direct signals after either member blocks or is suspended", async () => {
    const { t, alice, bob, aliceId, bobId, conversationId } = await fixture();
    await t.run(ctx => ctx.db.insert("blocks", { blockerProfileId: bobId, blockedProfileId: aliceId, createdAt: Date.now() }));
    await expect(alice.query(api.activity.getConversationSignals, signal(conversationId))).rejects.toThrow();
    await expect(bob.mutation(api.activity.setTyping, { conversationId, isTyping: true })).rejects.toThrow();
    await t.run(ctx => ctx.db.patch(bobId, { status: "suspended" }));
    await expect(bob.mutation(api.activity.heartbeat, {})).rejects.toThrow();
  });

  it("denies group read/typing after removal and never exposes history from before joining", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-04T10:00:00Z"));
    const { t, alice, bob, outsider, bobId } = await fixture();
    const group = await alice.mutation(api.groups.create, { name: "Private picnic" });
    const old = await alice.mutation(api.messages.send, {
      conversationId: group, body: "Before Bob joined", clientNonce: "group-private-nonce-01",
    });
    const invite = await alice.mutation(api.groups.inviteMember, { conversationId: group, profileId: bobId });
    vi.setSystemTime(new Date("2026-11-04T10:00:01Z"));
    await bob.mutation(api.groups.acceptInvite, { inviteId: invite });
    await expect(outsider.query(api.activity.getConversationSignals, signal(group))).rejects.toThrow();
    await bob.mutation(api.activity.markRead, { conversationId: group, messageId: old });
    expect((await alice.query(api.activity.getConversationSignals, signal(group))).readBy).toEqual([]);
    vi.setSystemTime(new Date("2026-11-04T10:00:02Z"));
    const fresh = await alice.mutation(api.messages.send, {
      conversationId: group, body: "After joining", clientNonce: "group-private-nonce-02",
    });
    await bob.mutation(api.activity.markRead, { conversationId: group, messageId: fresh });
    await bob.mutation(api.activity.setTyping, { conversationId: group, isTyping: true });
    const visible = await alice.query(api.activity.getConversationSignals, signal(group));
    expect(visible.readBy).toHaveLength(1);
    expect(visible.typing).toHaveLength(1);
    await alice.mutation(api.groups.removeMember, { conversationId: group, profileId: bobId });
    expect((await alice.query(api.activity.getConversationSignals, signal(group))).readBy).toEqual([]);
    expect((await alice.query(api.activity.getConversationSignals, signal(group))).typing).toEqual([]);
    await expect(bob.query(api.activity.getConversationSignals, signal(group))).rejects.toThrow();
    await expect(bob.mutation(api.activity.setTyping, { conversationId: group, isTyping: true })).rejects.toThrow();
    await expect(bob.mutation(api.activity.markRead, { conversationId: group, messageId: fresh })).rejects.toThrow();
    expect((await t.run(ctx => ctx.db.query("conversationMembers").withIndex("by_conversation_profile",
      q => q.eq("conversationId", group)).collect())).toHaveLength(1);
  });
});
