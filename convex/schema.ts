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

  baserowConfig: defineTable({
    userId: v.string(),
    apiToken: v.string(),
    tableId: v.string(),
  }).index("by_user", ["userId"]),

  ledgerSnapshots: defineTable({
    userId: v.string(),
    timestamp: v.number(),
    beforeContent: v.string(),
    afterContent: v.string(),
    baserowEntries: v.array(v.object({
      date: v.string(),
      hours: v.number(),
      person: v.string(),
    })),
    beeminderEntries: v.array(v.object({
      date: v.string(),
      hours: v.number(),
    })),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_time", ["userId", "timestamp"]),
});
