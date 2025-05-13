import { action, mutation, internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

interface Entry {
  date: string;
  amount: string; // Changed from hours/rate to amount to support expressions
  from: string; // Changed from account to from/to
  to: string;
  comment: string;
}

interface BaserowEntry {
  date: string;
  hours: number;
  person: string;
}

interface BeeminderEntry {
  date: string;
  hours: number;
}

interface BaserowResponse {
  results: {
    Date: string;
    Hours: string;
    User: { id: number; value: string }[];
  }[];
}

interface BeeminderResponse {
  timestamp: number;
  value: number;
}

export const fetchEntries = action({
  args: {
    baserowApiToken: v.string(),
    baserowTableId: v.string(),
    beeminderApiToken: v.string(),
    userId: v.string(),
    beforeContent: v.string(),
  },
  handler: async (ctx, args) => {
    // Fetch from Baserow
    const baserowResponse = await fetch(
      "https://" +
        process.env.BASEROW_DOMAIN +
        "/api/database/rows/table/" +
        args.baserowTableId +
        "/?user_field_names=true&filters=%7B%22filter_type%22%3A%22AND%22%2C%22filters%22%3A%5B%7B%22type%22%3A%22higher_than%22%2C%22field%22%3A%22Hours%22%2C%22value%22%3A%220%22%7D%2C%7B%22type%22%3A%22boolean%22%2C%22field%22%3A%22Billable%22%2C%22value%22%3A%221%22%7D%2C%7B%22type%22%3A%22link_row_has%22%2C%22field%22%3A%22User%22%2C%22value%22%3A%222%22%7D%5D%2C%22groups%22%3A%5B%5D%7D",
      {
        headers: {
          Authorization: "Token " + args.baserowApiToken,
        },
      },
    );

    if (!baserowResponse.ok) {
      throw new Error("Failed to fetch Baserow entries");
    }

    const baserowData = (await baserowResponse.json()) as BaserowResponse;
    const baserowEntries = baserowData.results.map((row) => ({
      date: row.Date,
      hours: parseFloat(row.Hours),
      person: row.User[0].value,
    }));

    // Fetch from Beeminder
    const beeminderResponse = await fetch(
      "https://www.beeminder.com/api/v1/users/narthur/goals/bizsys/datapoints.json?auth_token=" +
        args.beeminderApiToken,
    );

    if (!beeminderResponse.ok) {
      throw new Error("Failed to fetch Beeminder entries");
    }

    const beeminderData =
      (await beeminderResponse.json()) as BeeminderResponse[];
    const beeminderEntries = beeminderData.map((point) => ({
      date: new Date(point.timestamp * 1000)
        .toISOString()
        .split("T")[0]
        .replace(/-/g, "."),
      hours: point.value,
    }));

    // Process entries
    const entries = parseLedger(args.beforeContent);
    const mergedEntries = mergeEntries(
      entries,
      baserowEntries,
      beeminderEntries,
    );
    const newContent = generateLedger(mergedEntries);

    // Save result using internal mutation
    await ctx.runMutation(internal.ledger.saveResult, {
      userId: args.userId,
      beforeContent: args.beforeContent,
      afterContent: newContent,
      baserowEntries,
      beeminderEntries,
    });

    return { newContent };
  },
});

export const saveResult = internalMutation({
  args: {
    userId: v.string(),
    beforeContent: v.string(),
    afterContent: v.string(),
    baserowEntries: v.array(
      v.object({
        date: v.string(),
        hours: v.number(),
        person: v.string(),
      }),
    ),
    beeminderEntries: v.array(
      v.object({
        date: v.string(),
        hours: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("ledgerSnapshots", {
      userId: args.userId,
      timestamp: Date.now(),
      beforeContent: args.beforeContent,
      afterContent: args.afterContent,
      baserowEntries: args.baserowEntries,
      beeminderEntries: args.beeminderEntries,
    });

    return args.afterContent;
  },
});

export const update = mutation({
  args: {
    currentContent: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get configurations
    const baserowConfig = await ctx.db
      .query("baserowConfig")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();

    const beeminderConfig = await ctx.db
      .query("beeminderConfig")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();

    if (!baserowConfig || !beeminderConfig) {
      throw new Error("Missing configuration");
    }

    // Schedule action to fetch and process entries
    await ctx.scheduler.runAfter(0, internal.ledger.fetchEntries, {
      baserowApiToken: baserowConfig.apiToken,
      baserowTableId: baserowConfig.tableId,
      beeminderApiToken: beeminderConfig.apiToken,
      userId: identity.subject,
      beforeContent: args.currentContent,
    });

    return { status: "processing" };
  },
});

export function parseLedger(content: string): Entry[] {
  return content
    .split("\n")
    .filter((line) => line.trim().startsWith("iou["))
    .map((line) => {
      // Match format: iou[YYYY.MM.DD, amount, from, to, "comment"]
      const match = line.match(/iou\[(.*?), (.*?), (.*?), (.*?), "(.*?)"\]/);
      if (!match) throw new Error("Invalid line format: " + line);

      const [, date, amount, from, to, comment] = match;
      return {
        date: date.trim(),
        amount: amount.trim(),
        from: from.trim(),
        to: to.trim(),
        comment: comment.trim(),
      };
    });
}

export function mergeEntries(
  currentEntries: Entry[],
  baserowEntries: BaserowEntry[],
  beeminderEntries: BeeminderEntry[],
): Entry[] {
  const merged = [...currentEntries];

  // Add Luke's entries from Baserow
  baserowEntries.forEach((entry) => {
    const date = entry.date.replace(/-/g, ".");
    if (!merged.some((e) => e.date === date)) {
      merged.push({
        date,
        amount: `${entry.hours}*35`,
        from: "ppd",
        to: "la",
        comment: "hours",
      });
    }
  });

  // Add Nathan's entries from Beeminder
  beeminderEntries.forEach((entry) => {
    if (!merged.some((e) => e.date === entry.date)) {
      merged.push({
        date: entry.date,
        amount: `${entry.hours}*35`,
        from: "ppd",
        to: "na",
        comment: "hours",
      });
    }
  });

  // Sort by date descending
  return merged.sort((a, b) => b.date.localeCompare(a.date));
}

export function generateLedger(entries: Entry[]): string {
  return entries
    .map(
      (entry) =>
        `iou[${entry.date}, ${entry.amount}, ${entry.from}, ${entry.to}, "${entry.comment}"]`,
    )
    .join("\n");
}

export const getLatestSnapshot = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db
      .query("ledgerSnapshots")
      .withIndex("by_user_and_time", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .first();
  },
});
