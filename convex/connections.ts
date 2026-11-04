import { query } from "./_generated/server";
import { requireAuthorizedProfile } from "./lib/permissions";

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const me = await requireAuthorizedProfile(ctx);
    const [left, right] = await Promise.all([
      ctx.db.query("connections").withIndex("by_left", (q) => q.eq("leftProfileId", me._id)).take(100),
      ctx.db.query("connections").withIndex("by_right", (q) => q.eq("rightProfileId", me._id)).take(100),
    ]);
    const visible = [...left, ...right];
    const contacts = await Promise.all(visible.map(async (connection) => {
      const peerId = connection.leftProfileId === me._id
        ? connection.rightProfileId : connection.leftProfileId;
      const peer = await ctx.db.get(peerId);
      return peer?.status === "active"
        ? { connectionId: connection._id, profileId: peerId,
            displayName: peer.displayName, handle: peer.handle, connectedAt: connection.createdAt }
        : null;
    }));
    return contacts.filter((item) => item !== null);
  },
});
