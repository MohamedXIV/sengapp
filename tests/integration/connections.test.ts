import { describe, expect, it, vi, afterEach } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";

const modules = import.meta.glob("../../convex/**/*.{ts,js}");
afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });

function newMember(t: ReturnType<typeof convexTest>, subject: string, email: string) {
  return t.withIdentity({ subject, email, emailVerified: true, name: subject });
}

describe("Private one-use connection invitations", () => {
  it("lets ordinary verified members issue and explicitly accept with one symmetric relationship", async () => {
    const t = convexTest(schema, modules);
    const alice = newMember(t, "alice", "alice@example.com");
    const bob = newMember(t, "bob", "bob@example.com");
    await alice.mutation(api.profiles.ensureMine, {});
    await bob.mutation(api.profiles.ensureMine, {});
    const { code } = await alice.action(api.connectionInvites.issue, { ttlHours: 24, note: "Let's chat" });
    expect(code).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(await bob.query(api.connectionInvites.preview, { code })).toMatchObject({
      valid: true, senderDisplayName: "alice", note: "Let's chat",
    });
    const before = await bob.query(api.connections.listMine, {});
    expect(before).toHaveLength(0);
    const result = await bob.mutation(api.connectionInvites.accept, { code });
    expect(result.connectionId).toBeTruthy();
    expect(await bob.query(api.connections.listMine, {})).toHaveLength(1);
    expect(await alice.query(api.connections.listMine, {})).toHaveLength(1);
    const database = await t.run(async (ctx) => ({
      links: await ctx.db.query("connectionInvites").collect(),
      connections: await ctx.db.query("connections").collect(),
    }));
    expect(database.links).toHaveLength(1);
    expect(database.links[0]?.status).toBe("accepted");
    expect(database.connections).toHaveLength(1);
    expect(JSON.stringify(database.links)).not.toContain(code);
    await expect(bob.mutation(api.connectionInvites.accept, { code })).rejects.toThrow();
  });

  it("binds optional verified email, refuses self-acceptance and preserves codes on rejection", async () => {
    const t = convexTest(schema, modules);
    const alice = newMember(t, "alice", "alice@example.com");
    const bob = newMember(t, "bob", "bob@example.com");
    const wrong = newMember(t, "wrong", "wrong@example.com");
    await Promise.all([alice.mutation(api.profiles.ensureMine, {}), bob.mutation(api.profiles.ensureMine, {}), wrong.mutation(api.profiles.ensureMine, {})]);
    const { code } = await alice.action(api.connectionInvites.issue, { ttlHours: 72, recipientEmail: "bob@example.com" });
    await expect(alice.mutation(api.connectionInvites.accept, { code })).rejects.toThrow();
    await expect(wrong.mutation(api.connectionInvites.accept, { code })).rejects.toThrow();
    expect(await wrong.query(api.connectionInvites.preview, { code })).toMatchObject({ valid: false });
    expect((await alice.query(api.connectionInvites.listMine, {}))[0]?.status).toBe("pending");
    await bob.mutation(api.connectionInvites.accept, { code });
    expect(await bob.query(api.connections.listMine, {})).toHaveLength(1);
    expect(await wrong.query(api.connections.listMine, {})).toHaveLength(0);
  });

  it("atomically accepts at most once across races and never exposes other members' invitations", async () => {
    const t = convexTest(schema, modules);
    const alice = newMember(t, "alice", "alice@example.com");
    const bob = newMember(t, "bob", "bob@example.com");
    const carla = newMember(t, "carla", "carla@example.com");
    await Promise.all([alice.mutation(api.profiles.ensureMine, {}), bob.mutation(api.profiles.ensureMine, {}), carla.mutation(api.profiles.ensureMine, {})]);
    const { code } = await alice.action(api.connectionInvites.issue, { ttlHours: 24 });
    const result = await Promise.allSettled([
      bob.mutation(api.connectionInvites.accept, { code }),
      carla.mutation(api.connectionInvites.accept, { code }),
    ]);
    expect(result.filter((x) => x.status === "fulfilled")).toHaveLength(1);
    expect((await t.run((ctx) => ctx.db.query("connections").collect()))).toHaveLength(1);
    expect(await bob.query(api.connectionInvites.listMine, {})).toHaveLength(0);
  });

  it("rejects expired/revoked/declined links, unauthorized revocation and both block directions", async () => {
    const t = convexTest(schema, modules);
    const alice = newMember(t, "alice", "alice@example.com");
    const bob = newMember(t, "bob", "bob@example.com");
    const idA = await alice.mutation(api.profiles.ensureMine, {});
    const idB = await bob.mutation(api.profiles.ensureMine, {});
    const revokeLink = await alice.action(api.connectionInvites.issue, { ttlHours: 24 });
    const ledger = await alice.query(api.connectionInvites.listMine, {});
    const target = ledger.find((i) => i.codeHint.endsWith(revokeLink.code.slice(-4)));
    expect(target).toBeTruthy();
    await expect(bob.mutation(api.connectionInvites.revoke, { invitationId: target!._id })).rejects.toThrow();
    await alice.mutation(api.connectionInvites.revoke, { invitationId: target!._id });
    await expect(bob.mutation(api.connectionInvites.accept, { code: revokeLink.code })).rejects.toThrow();
    const declineLink = await alice.action(api.connectionInvites.issue, { ttlHours: 24 });
    await bob.mutation(api.connectionInvites.decline, { code: declineLink.code });
    await expect(bob.mutation(api.connectionInvites.accept, { code: declineLink.code })).rejects.toThrow();
    const expiry = await alice.action(api.connectionInvites.issue, { ttlHours: 24 });
    vi.useFakeTimers(); vi.setSystemTime(Date.now() + 24 * 3_600_000 + 1);
    await expect(bob.mutation(api.connectionInvites.accept, { code: expiry.code })).rejects.toThrow();
    vi.useRealTimers();
    const blocked = await alice.action(api.connectionInvites.issue, { ttlHours: 24 });
    await t.run((ctx) => ctx.db.insert("blocks", { blockerProfileId: idA, blockedProfileId: idB, createdAt: Date.now() }));
    await expect(bob.mutation(api.connectionInvites.accept, { code: blocked.code })).rejects.toThrow();
    expect((await alice.query(api.connectionInvites.listMine, {})).find((i) => i.codeHint.endsWith(blocked.code.slice(-4)))?.status).toBe("pending");
  });
});
