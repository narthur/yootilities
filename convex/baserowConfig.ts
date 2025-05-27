import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("baserowConfig"),
      _creationTime: v.number(),
      userId: v.string(),
      apiToken: v.string(),
      tableId: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const configs = await ctx.db
      .query("baserowConfig")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
    return configs[0] || null;
  },
});

export const save = mutation({
  args: {
    apiToken: v.string(),
    tableId: v.string(),
  },
  returns: v.id("baserowConfig"),
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
  returns: v.null(),
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
    return null;
  },
});