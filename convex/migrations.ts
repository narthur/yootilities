import { mutation } from "./_generated/server";

export const runMigrations = mutation({
  args: {},
  handler: async (ctx) => {
    const configs = await ctx.db
      .query("beeminderConfig")
      .filter((q) => q.eq(q.field("userId"), undefined))
      .collect();

    for (const config of configs) {
      await ctx.db.patch(config._id, {
        userId: "system",
      });
    }
  },
});