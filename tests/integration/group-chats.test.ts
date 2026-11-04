import { afterEach, describe, expect, it, vi } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";

const modules = import.meta.glob("../../convex/**/*.{ts,js}");
afterEach(() => vi.useRealTimers());

async function fixture() {
  const t = convexTest(schema, modules);
  const alice = t.withIdentity({ subject: "group-alice", email: "alice@example.com", emailVerified: true });
  const bob = t.withIdentity({ subject: "group-bob", email: "bob@example.com", emailVerified: true });
  const carla = t.withIdentity({ subject: "group-carla", email: "carla@example.com", emailVerified: true });
  const outsider = t.withIdentity({ subject: "group-outsider", email: "outsider@example.com", emailVerified: true });
  const [aliceId, bobId, carlaId, outsiderId] = await Promise.all([
    alice.mutation(api.profiles.ensureMine, {}),
    bob.mutation(api.profiles.ensureMine, {}),
    carla.mutation(api.profiles.ensureMine, {}),
    outsider.mutation(api.profiles.ensureMine, {}),
  ]);
  await t.run(async ctx => {
    await ctx.db.insert("connections", { leftProfileId: aliceId, rightProfileId: bobId, createdBy: aliceId, createdAt: Date.now() });
    await ctx.db.insert("connections", { leftProfileId: aliceId, rightProfileId: carlaId, createdBy: aliceId, createdAt: Date.now() });
  });
  return { t, alice, bob, carla, outsider, aliceId, bobId, carlaId, outsiderId };
}

describe("private group conversations", () => {
  it("creates a private named group visible only to its owner", async () => {
    const { alice, bob, outsider } = await fixture();
    const id = await alice.mutation(api.groups.create, { name: "  Little Forest  " });
    expect(await alice.query(api.conversations.listMine, {})).toMatchObject([
      { conversationId: id, kind: "group", displayName: "Little Forest" },
    ]);
    expect(await bob.query(api.conversations.listMine, {})).toEqual([]);
    expect(await outsider.query(api.conversations.listMine, {})).toEqual([]);
    expect(await alice.query(api.conversations.getOne, { conversationId: id })).toMatchObject({
      kind: "group", displayName: "Little Forest",
    });
    await expect(outsider.query(api.conversations.getOne, { conversationId: id })).rejects.toThrow();
    await expect(outsider.query(api.groups.getDetails, { conversationId: id })).rejects.toThrow();
  });

  it("invites only accepted contacts, requiring the recipient's explicit acceptance", async () => {
    const { alice, bob, carla, outsider, bobId, outsiderId } = await fixture();
    const group = await alice.mutation(api.groups.create, { name: "Cozy circle" });
    await expect(outsider.mutation(api.groups.inviteMember, { conversationId: group, profileId: bobId })).rejects.toThrow();
    await expect(alice.mutation(api.groups.inviteMember, { conversationId: group, profileId: outsiderId })).rejects.toThrow();
    const inviteId = await alice.mutation(api.groups.inviteMember, { conversationId: group, profileId: bobId });
    expect(await bob.query(api.groups.listInvitesMine, {})).toMatchObject([
      { inviteId, conversationId: group, groupName: "Cozy circle" },
    ]);
    expect(await carla.query(api.groups.listInvitesMine, {})).toEqual([]);
    await expect(outsider.mutation(api.groups.acceptInvite, { inviteId })).rejects.toThrow();
    expect(await bob.query(api.conversations.listMine, {})).toEqual([]);
    await bob.mutation(api.groups.declineInvite, { inviteId });
    await expect(bob.mutation(api.groups.acceptInvite, { inviteId })).rejects.toThrow();
    const reissued = await alice.mutation(api.groups.inviteMember, { conversationId: group, profileId: bobId });
    await bob.mutation(api.groups.acceptInvite, { inviteId: reissued });
    expect(await bob.query(api.conversations.listMine, {})).toMatchObject([{ kind: "group", conversationId: group }]);
    expect((await alice.query(api.groups.getDetails, { conversationId: group })).members).toHaveLength(2);
    await expect(outsider.query(api.groups.getDetails, { conversationId: group })).rejects.toThrow();
  });

  it("hides pre-join group history and denies reads after removal or between memberships", async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-29T10:00:00Z"));
    const { alice, bob, outsider, bobId } = await fixture();
    const group = await alice.mutation(api.groups.create, { name: "Privacy first" });
    const opts = { numItems: 20, cursor: null };
    await alice.mutation(api.messages.send, { conversationId: group, body: "before joining", clientNonce: "group-message-before01" });
    const firstInvite = await alice.mutation(api.groups.inviteMember, { conversationId: group, profileId: bobId });
    vi.setSystemTime(new Date("2026-10-29T10:00:01Z"));
    await bob.mutation(api.groups.acceptInvite, { inviteId: firstInvite });
    expect((await bob.query(api.messages.list, { conversationId: group, paginationOpts: opts })).page).toEqual([]);
    vi.setSystemTime(new Date("2026-10-29T10:00:02Z"));
    await alice.mutation(api.messages.send, { conversationId: group, body: "hello Bob", clientNonce: "group-message-after001" });
    expect((await bob.query(api.messages.list, { conversationId: group, paginationOpts: opts })).page.map(m => m.body)).toEqual(["hello Bob"]);
    await expect(outsider.query(api.messages.list, { conversationId: group, paginationOpts: opts })).rejects.toThrow();
    await alice.mutation(api.groups.removeMember, { conversationId: group, profileId: bobId });
    await expect(bob.query(api.messages.list, { conversationId: group, paginationOpts: opts })).rejects.toThrow();
    await expect(bob.mutation(api.messages.send, { conversationId: group, body: "not allowed", clientNonce: "group-removed-nonce001" })).rejects.toThrow();
    vi.setSystemTime(new Date("2026-10-29T10:00:03Z"));
    await alice.mutation(api.messages.send, { conversationId: group, body: "while removed", clientNonce: "group-message-hidden001" });
    const secondInvite = await alice.mutation(api.groups.inviteMember, { conversationId: group, profileId: bobId });
    vi.setSystemTime(new Date("2026-10-29T10:00:04Z"));
    await bob.mutation(api.groups.acceptInvite, { inviteId: secondInvite });
    expect((await bob.query(api.messages.list, { conversationId: group, paginationOpts: opts })).page).toEqual([]);
  });

  it("enforces owner/admin boundaries, refuses owner removal, and allows members to leave", async () => {
    const { alice, bob, carla, outsider, bobId, carlaId } = await fixture();
    const group = await alice.mutation(api.groups.create, { name: "Admin circle" });
    const a = await alice.mutation(api.groups.inviteMember, { conversationId: group, profileId: bobId });
    const b = await alice.mutation(api.groups.inviteMember, { conversationId: group, profileId: carlaId });
    await bob.mutation(api.groups.acceptInvite, { inviteId: a });
    await carla.mutation(api.groups.acceptInvite, { inviteId: b });
    await expect(bob.mutation(api.groups.setRole, { conversationId: group, profileId: carlaId, role: "admin" })).rejects.toThrow();
    await alice.mutation(api.groups.setRole, { conversationId: group, profileId: bobId, role: "admin" });
    await expect(bob.mutation(api.groups.removeMember, { conversationId: group, profileId: (await alice.query(api.profiles.getMine, {}))!._id })).rejects.toThrow();
    await bob.mutation(api.groups.removeMember, { conversationId: group, profileId: carlaId });
    await expect(carla.query(api.groups.getDetails, { conversationId: group })).rejects.toThrow();
    await expect(outsider.mutation(api.groups.rename, { conversationId: group, name: "stolen" })).rejects.toThrow();
    await alice.mutation(api.groups.rename, { conversationId: group, name: "Friends only" });
    expect((await bob.query(api.groups.getDetails, { conversationId: group })).name).toBe("Friends only");
    await expect(alice.mutation(api.groups.leave, { conversationId: group })).rejects.toThrow();
    await bob.mutation(api.groups.leave, { conversationId: group });
    expect(await bob.query(api.conversations.listMine, {})).toEqual([]);
  });

  it("rejects revoked identity access, blocks and suspended group members", async () => {
    const { t, alice, bob, aliceId, bobId } = await fixture();
    const group = await alice.mutation(api.groups.create, { name: "Safer circle" });
    const inviteId = await alice.mutation(api.groups.inviteMember, { conversationId: group, profileId: bobId });
    await t.run(ctx => ctx.db.insert("blocks", { blockerProfileId: bobId, blockedProfileId: aliceId, createdAt: Date.now() }));
    await expect(bob.mutation(api.groups.acceptInvite, { inviteId })).rejects.toThrow();
    await expect(alice.mutation(api.groups.inviteMember, { conversationId: group, profileId: bobId })).rejects.toThrow();
    await t.run(async ctx => {
      const block = await ctx.db.query("blocks").withIndex("by_pair", q => q.eq("blockerProfileId", bobId).eq("blockedProfileId", aliceId)).unique();
      if (block) await ctx.db.delete(block._id);
    });
    await bob.mutation(api.groups.acceptInvite, { inviteId });
    await t.run(ctx => ctx.db.patch(bobId, { status: "suspended" }));
    await expect(bob.query(api.groups.getDetails, { conversationId: group })).rejects.toThrow();
    await expect(bob.mutation(api.messages.send, { conversationId: group, body: "blocked", clientNonce: "suspended-group-nonce" })).rejects.toThrow();
    const unverified = t.withIdentity({ subject: "group-bob", email: "bob@example.com", emailVerified: false });
    await expect(unverified.query(api.messages.list, {
      conversationId: group, paginationOpts: { numItems: 10, cursor: null },
    })).rejects.toThrow();
  });

  it("enforces one accepted membership per invitation and validates group names", async () => {
    const { t, alice, bob, bobId } = await fixture();
    await expect(alice.mutation(api.groups.create, { name: "  " })).rejects.toThrow();
    await expect(alice.mutation(api.groups.create, { name: "x".repeat(61) })).rejects.toThrow();
    const group = await alice.mutation(api.groups.create, { name: "One-time invite" });
    const inviteId = await alice.mutation(api.groups.inviteMember, { conversationId: group, profileId: bobId });
    await expect(alice.mutation(api.groups.inviteMember, { conversationId: group, profileId: bobId })).rejects.toThrow();
    const results = await Promise.allSettled([
      bob.mutation(api.groups.acceptInvite, { inviteId }),
      bob.mutation(api.groups.acceptInvite, { inviteId }),
    ]);
    expect(results.filter(result => result.status === "fulfilled")).toHaveLength(1);
    expect((await t.run(ctx => ctx.db.query("conversationMembers").withIndex("by_conversation_profile",
      q => q.eq("conversationId", group)).collect()))).toHaveLength(2);
    await expect(bob.mutation(api.groups.acceptInvite, { inviteId })).rejects.toThrow();
  });
});
