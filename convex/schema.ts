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
    
  invoiceRequests: defineTable({
    requestId: v.string(),
    userId: v.string(),
    status: v.string(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    result: v.object({
      entries: v.array(v.object({
        date: v.string(),
        start: v.string(),
        end: v.string(),
        hours: v.number(),
        user: v.string(),
        notes: v.string(),
        client: v.string(),
      })),
      totalHours: v.number(),
      error: v.optional(v.string()),
    }),
  })
    .index("by_user", ["userId"])
    .index("by_requestId", ["requestId"])
    .index("by_status", ["status"]),
});
