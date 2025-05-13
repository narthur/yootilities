import { mutation } from "./_generated/server";
import { v } from "convex/values";

interface Entry {
  date: string;
  hours: number;
  account: string;
  comment: string;
  rate: number;
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
    date: string;
    hours: string | number;
    person: string;
  }[];
}

interface BeeminderResponse {
  timestamp: number;
  value: number;
}

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

    // Parse current ledger
    const entries = parseLedger(args.currentContent);

    // Fetch new entries from Baserow
    const baserowEntries = await fetchBaserowEntries(
      baserowConfig.apiToken,
      baserowConfig.tableId
    );

    // Fetch new entries from Beeminder
    const beeminderEntries = await fetchBeeminderEntries(
      beeminderConfig.apiToken
    );

    // Merge all entries
    const mergedEntries = mergeEntries(entries, baserowEntries, beeminderEntries);

    // Generate new ledger content
    const newContent = generateLedger(mergedEntries);

    // Save snapshot
    await ctx.db.insert("ledgerSnapshots", {
      userId: identity.subject,
      timestamp: Date.now(),
      beforeContent: args.currentContent,
      afterContent: newContent,
      baserowEntries,
      beeminderEntries,
    });

    return { newContent };
  },
});

export function parseLedger(content: string): Entry[] {
  return content
    .split("\n")
    .filter(line => line.trim().startsWith("iou["))
    .map(line => {
      const match = line.match(/iou\[(.*?), (.*?)\*(.*?), ppd, (.*?), "(.*?)"\]/);
      if (!match) throw new Error("Invalid line format: " + line);
      
      const [, date, hours, rate, account, comment] = match;
      return {
        date: date.trim(),
        hours: parseFloat(hours),
        rate: parseFloat(rate),
        account: account.trim(),
        comment: comment.trim(),
      };
    });
}

async function fetchBaserowEntries(apiToken: string, tableId: string): Promise<BaserowEntry[]> {
  const response = await fetch(
    "https://api.baserow.io/api/database/rows/table/" + tableId + "/?user_field_names=true",
    {
      headers: {
        Authorization: "Token " + apiToken,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch Baserow entries");
  }

  const data = (await response.json()) as BaserowResponse;
  return data.results.map((row) => ({
    date: row.date,
    hours: parseFloat(row.hours.toString()),
    person: row.person,
  }));
}

async function fetchBeeminderEntries(apiToken: string): Promise<BeeminderEntry[]> {
  const response = await fetch(
    "https://www.beeminder.com/api/v1/users/narthur/goals/bizsys/datapoints.json?auth_token=" + apiToken
  );

  if (!response.ok) {
    throw new Error("Failed to fetch Beeminder entries");
  }

  const data = (await response.json()) as BeeminderResponse[];
  return data.map((point) => ({
    date: new Date(point.timestamp * 1000).toISOString().split("T")[0].replace(/-/g, "."),
    hours: point.value,
  }));
}

export function mergeEntries(
  currentEntries: Entry[],
  baserowEntries: BaserowEntry[],
  beeminderEntries: BeeminderEntry[]
): Entry[] {
  const merged = [...currentEntries];

  // Add Luke's entries from Baserow
  baserowEntries
    .filter(entry => entry.person === "Luke")
    .forEach(entry => {
      const date = entry.date.replace(/-/g, ".");
      if (!merged.some(e => e.date === date)) {
        merged.push({
          date,
          hours: entry.hours,
          rate: 35, // Default rate
          account: "la", // Luke's account
          comment: "hours",
        });
      }
    });

  // Add Nathan's entries from Beeminder
  beeminderEntries.forEach(entry => {
    if (!merged.some(e => e.date === entry.date)) {
      merged.push({
        date: entry.date,
        hours: entry.hours,
        rate: 35, // Default rate
        account: "na", // Nathan's account
        comment: "hours",
      });
    }
  });

  // Sort by date descending
  return merged.sort((a, b) => b.date.localeCompare(a.date));
}

export function generateLedger(entries: Entry[]): string {
  return entries
    .map(entry => 
      "iou[" + entry.date + ", " + entry.hours + "*" + entry.rate + ", ppd, " + entry.account + ", \"" + entry.comment + "\"]"
    )
    .join("\n");
}