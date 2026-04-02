import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const sendMessage = mutation({
  args: { body: v.string(), user: v.string() },
  handler: async (ctx, { body, user }) => {
    const trimmed = body.trim();
    if (!trimmed) return;
    await ctx.db.insert("messages", {
      body: trimmed,
      user,
      createdAt: Date.now(),
    });
  },
});

export const getMessages = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_createdAt", (q) => q)
      .order("asc")
      .collect();
  },
});
