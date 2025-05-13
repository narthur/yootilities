import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const configs = await ctx.db
      .query("baserowConfig")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
    return configs[0];
  },
});

export const save = mutation({
  args: {
    apiToken: v.string(),
    tableId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const configs = await ctx.db
      .query("baserowConfig")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
    
    if (configs.length > 0) {
      await ctx.db.patch(configs[0]._id, args);
      return configs[0]._id;
    } else {
      return await ctx.db.insert("baserowConfig", {
        ...args,
        userId: identity.subject,
      });
    }
  },
});

export const remove = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const configs = await ctx.db
      .query("baserowConfig")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
    if (configs.length > 0) {
      await ctx.db.delete(configs[0]._id);
    }
  },
});