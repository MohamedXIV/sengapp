import { afterEach, describe, expect, it, vi } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";

const modules = import.meta.glob("../../convex/**/*.{ts,js}");
const paginationOpts = { numItems: 25, cursor: null };
afterEach(() => vi.useRealTimers());

async function fixture() {
  const t = convexTest(schema, modules);
  const alice = t.withIdentity({ subject: "actions-alice", email: "actions-a@example.com", emailVerified: true });
  const bob = t.withIdentity({ subject: "actions-bob", email: "actions-b@example.com", emailVerified: true });
  const outsider = t.withIdentity({ subject: "actions-outsider", email: "actions-c@example.com", emailVerified: true });
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

describe("private replies, edits, deletes and emoji reactions", () => {
  it("allows only the original author to edit within fifteen minutes and validates content", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-06T12:00:00Z"));
    const { alice, bob, outsider, conversationId } = await fixture();
    const id = await alice.mutation(api.messages.send, {
      conversationId, body: "Original text", clientNonce: "message-action-edit-01",
    });
    await expect(bob.mutation(api.messages.edit, { messageId: id, body: "stolen" })).rejects.toThrow();
    await expect(outsider.mutation(api.messages.edit, { messageId: id, body: "stolen" })).rejects.toThrow();
    await expect(alice.mutation(api.messages.edit, { messageId: id, body: " " })).rejects.toThrow();
    await alice.mutation(api.messages.edit, { messageId: id, body: "  Updated text  " });
    const updated = (await bob.query(api.messages.list, { conversationId, paginationOpts })).page[0];
    expect(updated).toMatchObject({ body: "Updated text", editedAt: expect.any(Number) });
    expect(updated?.editedAt).toBeGreaterThanOrEqual(updated?.createdAt ?? 0);
    vi.setSystemTime(new Date("2026-11-06T12:16:00Z"));
    await expect(alice.mutation(api.messages.edit, { messageId: id, body: "Too late" })).rejects.toThrow();
  });

  it("replies only to a visible message in the same conversation and makes retries idempotent", async () => {
    const { t, alice, bob, outsider, aliceId, conversationId } = await fixture();
    const targetId = await alice.mutation(api.messages.send, {
      conversationId, body: "Where?", clientNonce: "message-reply-target01",
    });
    const replyArgs = {
      conversationId, body: "Here.", replyToMessageId: targetId,
      clientNonce: "message-reply-answer01",
    };
    const id = await bob.mutation(api.messages.send, replyArgs);
    expect(await bob.mutation(api.messages.send, replyArgs)).toEqual(id);
    const rows = (await alice.query(api.messages.list, { conversationId, paginationOpts })).page;
    expect(rows[0]).toMatchObject({
      replyToMessageId: targetId, replyPreview: { body: "Where?" },
    });
    const foreignId = await t.run(async ctx => {
      const foreignConversation = await ctx.db.insert("conversations", {
        kind: "group", groupName: "Hidden", ownerProfileId: aliceId,
        createdAt: Date.now(), updatedAt: Date.now(),
      });
      return ctx.db.insert("messages", {
        conversationId: foreignConversation, senderProfileId: aliceId,
        body: "Private", clientNonce: "message-reply-foreign1", createdAt: Date.now(),
      });
    });
    await expect(bob.mutation(api.messages.send, {
      ...replyArgs, clientNonce: "message-reply-outsider1", body: "new",
      replyToMessageId: foreignId,
    })).rejects.toThrow();
    await expect(outsider.mutation(api.messages.send, {
      conversationId, body: "No access", clientNonce: "message-reply-noaccess1", replyToMessageId: targetId,
    })).rejects.toThrow();
  });

  it("keeps a safe tombstone and invalidates previews without restoring deleted text", async () => {
    const { alice, bob, outsider, conversationId } = await fixture();
    const target = await alice.mutation(api.messages.send, {
      conversationId, body: "Delete this secret", clientNonce: "message-delete-target1",
    });
    await bob.mutation(api.messages.send, {
      conversationId, body: "Okay", clientNonce: "message-delete-reply01",
      replyToMessageId: target,
    });
    await bob.mutation(api.messages.toggleReaction, { messageId: target, emoji: "❤️" });
    await expect(bob.mutation(api.messages.remove, { messageId: target })).rejects.toThrow();
    await expect(outsider.mutation(api.messages.remove, { messageId: target })).rejects.toThrow();
    await alice.mutation(api.messages.remove, { messageId: target });
    await alice.mutation(api.messages.remove, { messageId: target }); // idempotent
    const rows = (await bob.query(api.messages.list, { conversationId, paginationOpts })).page;
    expect(rows[0]).toMatchObject({ replyPreview: { body: null, senderProfileId: null } });
    expect(rows[1]).toMatchObject({ body: "", reactions: [] });
    expect(rows[1]?.deletedAt).toEqual(expect.any(Number));
    expect(JSON.stringify(rows)).not.toContain("Delete this secret");
    await expect(alice.mutation(api.messages.edit, { messageId: target, body: "Reborn" })).rejects.toThrow();
    await expect(bob.mutation(api.messages.toggleReaction, { messageId: target, emoji: "😂" })).rejects.toThrow();
    await expect(bob.mutation(api.messages.send, {
      conversationId, body: "No", clientNonce: "message-delete-reply02", replyToMessageId: target,
    })).rejects.toThrow();
  });

  it("toggles a bounded single reaction per person and refuses unapproved emoji", async () => {
    const { alice, bob, outsider, conversationId } = await fixture();
    const target = await alice.mutation(api.messages.send, {
      conversationId, body: "React here", clientNonce: "message-reaction-target1",
    });
    await bob.mutation(api.messages.toggleReaction, { messageId: target, emoji: "👍" });
    await alice.mutation(api.messages.toggleReaction, { messageId: target, emoji: "👍" });
    expect((await alice.query(api.messages.list, { conversationId, paginationOpts })).page[0]?.reactions).toHaveLength(2);
    await bob.mutation(api.messages.toggleReaction, { messageId: target, emoji: "😂" });
    const reactions = (await alice.query(api.messages.list, { conversationId, paginationOpts })).page[0]?.reactions;
    expect(reactions).toHaveLength(2);
    expect(reactions?.filter(r => r.emoji === "😂")).toHaveLength(1);
    await bob.mutation(api.messages.toggleReaction, { messageId: target, emoji: "😂" });
    expect((await alice.query(api.messages.list, { conversationId, paginationOpts })).page[0]?.reactions).toHaveLength(1);
    await expect(outsider.mutation(api.messages.toggleReaction, { messageId: target, emoji: "😂" })).rejects.toThrow();
    await expect(bob.mutation(api.messages.toggleReaction, { messageId: target, emoji: "🔥" })).rejects.toThrow();
  });

  it("prevents reacting, editing and replying to pre-join group history or after removal", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-06T12:00:00Z"));
    const { alice, bob, bobId } = await fixture();
    const group = await alice.mutation(api.groups.create, { name: "Private group" });
    const oldId = await alice.mutation(api.messages.send, {
      conversationId: group, body: "Before you", clientNonce: "group-actions-old00001",
    });
    const inviteId = await alice.mutation(api.groups.inviteMember, { conversationId: group, profileId: bobId });
    vi.setSystemTime(new Date("2026-11-06T12:00:02Z"));
    await bob.mutation(api.groups.acceptInvite, { inviteId });
    await expect(bob.mutation(api.messages.toggleReaction, { messageId: oldId, emoji: "👍" })).rejects.toThrow();
    await expect(bob.mutation(api.messages.send, {
      conversationId: group, replyToMessageId: oldId, body: "Sneaky",
      clientNonce: "group-actions-reply0001",
    })).rejects.toThrow();
    const newId = await bob.mutation(api.messages.send, {
      conversationId: group, body: "Hello group", clientNonce: "group-actions-new00001",
    });
    await alice.mutation(api.messages.toggleReaction, { messageId: newId, emoji: "🎉" });
    await alice.mutation(api.groups.removeMember, { conversationId: group, profileId: bobId });
    await expect(bob.mutation(api.messages.edit, { messageId: newId, body: "Can't" })).rejects.toThrow();
    await expect(bob.mutation(api.messages.remove, { messageId: newId })).rejects.toThrow();
    await expect(bob.mutation(api.messages.toggleReaction, { messageId: newId, emoji: "🎉" })).rejects.toThrow();
  });
});
