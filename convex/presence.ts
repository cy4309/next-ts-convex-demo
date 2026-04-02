import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const DEFAULT_ACTIVE_MS = 5000;
const STALE_DELETE_MS = 60000;

export const updatePresence = mutation({
  args: {
    user: v.string(),
    typing: v.optional(v.boolean()),
  },
  handler: async (ctx, { user, typing }) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("presence")
      .withIndex("by_user", (q) => q.eq("user", user))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        lastSeen: now,
        ...(typing !== undefined ? { typing } : {}),
      });
    } else {
      await ctx.db.insert("presence", {
        user,
        lastSeen: now,
        typing: typing ?? false,
      });
    }

    const cutoff = now - STALE_DELETE_MS;
    const stale = await ctx.db.query("presence").collect();
    for (const row of stale) {
      if (row.lastSeen < cutoff) {
        await ctx.db.delete(row._id);
      }
    }
  },
});

export const getPresence = query({
  args: { activeWithinMs: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const window = args.activeWithinMs ?? DEFAULT_ACTIVE_MS;
    const cutoff = Date.now() - window;
    const all = await ctx.db.query("presence").collect();
    return all
      .filter((p) => p.lastSeen >= cutoff)
      .sort((a, b) => a.user.localeCompare(b.user));
  },
});
