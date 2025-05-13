import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  beeminderConfig: defineTable({
    userId: v.optional(v.string()),
    apiToken: v.string(),
    defaultRate: v.number(),
    defaultAccount: v.string(),
    defaultComment: v.string(),
  }).index("by_user", ["userId"]),
});
