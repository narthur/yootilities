import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  beeminderConfig: defineTable({
    apiToken: v.string(),
    defaultRate: v.number(),
    defaultAccount: v.string(),
    defaultComment: v.string(),
  }),
});
