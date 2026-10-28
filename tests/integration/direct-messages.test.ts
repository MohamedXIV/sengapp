import { describe, expect, it } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";

const modules = import.meta.glob("../../convex/**/*.{ts,js}");

async function fixture() {
  const t = convexTest(schema, modules);
  const alice = t.withIdentity({ subject: "dm-alice", email: "dm-alice@example.com", emailVerified: true });
  const bob = t.withIdentity({ subject: "dm-bob", email: "dm-bob@example.com", emailVerified: true });
  const outsider = t.withIdentity({ subject: "dm-outsider", email: "dm-outsider@example.com", emailVerified: true });
  const aliceId = await alice.mutation(api.profiles.ensureMine, {});
  const bobId = await bob.mutation(api.profiles.ensureMine, {});
  await outsider.mutation(api.profiles.ensureMine, {});
  const connectionId = await t.run(ctx => ctx.db.insert("connections", {
    leftProfileId: aliceId, rightProfileId: bobId,
    createdBy: aliceId, createdAt: Date.now(),
  }));
  return { t, alice, bob, outsider, aliceId, bobId, connectionId };
}

describe("authorized direct messaging", () => {
  it("only an accepted connection's participants can open one shared DM, even concurrently", async () => {
    const { t, alice, bob, outsider, connectionId } = await fixture();
    await expect(outsider.mutation(api.conversations.openDirect, { connectionId })).rejects.toThrow();
    const [a, b] = await Promise.all([
      alice.mutation(api.conversations.openDirect, { connectionId }),
      bob.mutation(api.conversations.openDirect, { connectionId }),
    ]);
    expect(a).toBe(b);
    expect(await alice.mutation(api.conversations.openDirect, { connectionId })).toBe(a);
    expect(await t.run(ctx => ctx.db.query("conversations").collect())).toHaveLength(1);
    expect(await t.run(ctx => ctx.db.query("conversationMembers").collect())).toHaveLength(2);
    expect(await alice.query(api.conversations.listMine, {})).toHaveLength(1);
    expect(await outsider.query(api.conversations.listMine, {})).toHaveLength(0);
    expect(await bob.query(api.conversations.getOne, { conversationId: a })).toMatchObject({
      conversationId: a, displayName: "New member",
    });
    await expect(outsider.query(api.conversations.getOne, { conversationId: a })).rejects.toThrow();
  });

  it("delivers durable text to both members and denies outsider reads/writes", async () => {
    const { alice, bob, outsider, connectionId } = await fixture();
    const conversationId = await alice.mutation(api.conversations.openDirect, { connectionId });
    await alice.mutation(api.messages.send, {
      conversationId, body: "  Hi Bob!  ", clientNonce: "alice-nonce-00000001",
    });
    const opts = { numItems: 10, cursor: null };
    expect((await bob.query(api.messages.list, { conversationId, paginationOpts: opts })).page).toMatchObject([
      { body: "Hi Bob!" },
    ]);
    expect((await alice.query(api.messages.list, { conversationId, paginationOpts: opts })).page).toHaveLength(1);
    await expect(outsider.query(api.messages.list, { conversationId, paginationOpts: opts })).rejects.toThrow();
    await expect(outsider.mutation(api.messages.send, {
      conversationId, body: "Eavesdrop", clientNonce: "outsider-nonce-00001",
    })).rejects.toThrow();
  });

  it("makes retries idempotent and rejects empty, oversized, or conflicting text", async () => {
    const { alice, connectionId, t } = await fixture();
    const conversationId = await alice.mutation(api.conversations.openDirect, { connectionId });
    const args = { conversationId, body: "Hello", clientNonce: "retry-unique-0000001" };
    const first = await alice.mutation(api.messages.send, args);
    expect(await alice.mutation(api.messages.send, args)).toBe(first);
    expect(await t.run(ctx => ctx.db.query("messages").collect())).toHaveLength(1);
    await expect(alice.mutation(api.messages.send, { ...args, body: "Changed" })).rejects.toThrow();
    await expect(alice.mutation(api.messages.send, { ...args, body: "  ", clientNonce: "retry-unique-0000002" })).rejects.toThrow();
    await expect(alice.mutation(api.messages.send, { ...args, body: "a".repeat(2001), clientNonce: "retry-unique-0000003" })).rejects.toThrow();
    await expect(alice.mutation(api.messages.send, { ...args, clientNonce: "bad" })).rejects.toThrow();
  });

  it("stops new messages after a block or suspension", async () => {
    const { t, alice, bob, aliceId, bobId, connectionId } = await fixture();
    const conversationId = await alice.mutation(api.conversations.openDirect, { connectionId });
    await t.run(ctx => ctx.db.insert("blocks", {
      blockerProfileId: bobId, blockedProfileId: aliceId, createdAt: Date.now(),
    }));
    await expect(alice.mutation(api.messages.send, {
      conversationId, body: "Blocked", clientNonce: "blocked-nonce-000001",
    })).rejects.toThrow();
    await expect(bob.mutation(api.messages.send, {
      conversationId, body: "Blocked back", clientNonce: "blocked-nonce-000002",
    })).rejects.toThrow();
    await t.run(ctx => ctx.db.patch(bobId, { status: "suspended" }));
    await expect(alice.query(api.messages.list, {
      conversationId, paginationOpts: { numItems: 10, cursor: null },
    })).rejects.toThrow();
  });

  it("rejects opening a new conversation when either connection member has blocked the other", async () => {
    const { t, alice, aliceId, bobId, connectionId } = await fixture();
    await t.run(ctx => ctx.db.insert("blocks", {
      blockerProfileId: bobId, blockedProfileId: aliceId, createdAt: Date.now(),
    }));
    await expect(alice.mutation(api.conversations.openDirect, { connectionId })).rejects.toThrow();
    expect(await t.run(ctx => ctx.db.query("conversations").collect())).toHaveLength(0);
  });

  it("paginates history and limits rapid sends without blocking idempotent retries", async () => {
    const { alice, bob, connectionId, t } = await fixture();
    const conversationId = await alice.mutation(api.conversations.openDirect, { connectionId });
    const firstArgs = { conversationId, body: "Message 00", clientNonce: "message-nonce-00000000" };
    const firstId = await alice.mutation(api.messages.send, firstArgs);
    for (let n = 1; n < 30; n++) {
      await alice.mutation(api.messages.send, {
        conversationId, body: `Message ${String(n).padStart(2, "0")}`,
        clientNonce: `message-nonce-${String(n).padStart(8, "0")}`,
      });
    }
    const firstPage = await bob.query(api.messages.list, {
      conversationId, paginationOpts: { numItems: 10, cursor: null },
    });
    expect(firstPage.page).toHaveLength(10);
    expect(firstPage.isDone).toBe(false);
    const olderPage = await bob.query(api.messages.list, {
      conversationId, paginationOpts: { numItems: 10, cursor: firstPage.continueCursor },
    });
    expect(olderPage.page).toHaveLength(10);
    expect(olderPage.page[0]._id).not.toBe(firstPage.page[0]._id);
    await expect(alice.mutation(api.messages.send, {
      conversationId, body: "Too fast", clientNonce: "message-nonce-00000030",
    })).rejects.toThrow();
    expect(await alice.mutation(api.messages.send, firstArgs)).toBe(firstId);
    expect(await t.run(ctx => ctx.db.query("messages").collect())).toHaveLength(30);
  });
});
