import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  messages: defineTable({
    body: v.string(),
    user: v.string(),
    createdAt: v.number(),
  }).index("by_createdAt", ["createdAt"]),
  presence: defineTable({
    user: v.string(),
    lastSeen: v.number(),
    typing: v.boolean(),
  }).index("by_user", ["user"]),
});
