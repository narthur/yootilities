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
    Start?: string;
    End?: string;
    Notes?: string;
    Client?: string;
    Billable?: boolean;
  }[];
}

interface BeeminderResponse {
  timestamp: number;
  value: number;
}

// Action to fetch invoice entries from Baserow
export const fetchInvoiceEntriesAction = action({
  args: {
    clientName: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    baserowApiToken: v.string(),
    baserowTableId: v.string(),
    requestId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      console.log("Starting Baserow fetch with args:", {
        clientName: args.clientName,
        startDate: args.startDate,
        endDate: args.endDate,
        tableId: args.baserowTableId,
        domain: process.env.BASEROW_DOMAIN,
      });

      // Build filter object - using the same format as the working implementation
      const filters = {
        filter_type: "AND",
        filters: [
          {
            type: "higher_than",
            field: "Hours",
            value: "0",
          },
          {
            type: "boolean",
            field: "Billable",
            value: "1",
          },
          {
            type: "contains",
            field: "Client Name",
            value: args.clientName,
          },
          {
            type: "date_is_on_or_after",
            field: "Start",
            value: args.startDate,
          },
          {
            type: "date_is_on_or_before",
            field: "Start",
            value: args.endDate,
          },
        ],
        groups: [],
      };

      console.log("Using filters:", JSON.stringify(filters));

      const url =
        "https://" +
        process.env.BASEROW_DOMAIN +
        "/api/database/rows/table/" +
        args.baserowTableId +
        "/?user_field_names=true&filters=" +
        encodeURIComponent(JSON.stringify(filters));

      console.log("Fetching from URL:", url);

      // Fetch entries from Baserow for a specific client within date range
      const baserowResponse = await fetch(url, {
        headers: {
          Authorization: "Token " + args.baserowApiToken,
        },
      });

      if (!baserowResponse.ok) {
        const errorText = await baserowResponse.text();
        console.error("Baserow API error:", {
          status: baserowResponse.status,
          statusText: baserowResponse.statusText,
          body: errorText,
          apiToken: args.baserowApiToken
            ? "Present (length: " + args.baserowApiToken.length + ")"
            : "Missing",
          tableId: args.baserowTableId,
          domain: process.env.BASEROW_DOMAIN || "Missing domain",
        });
        throw new Error(
          `Failed to fetch Baserow entries for invoice: ${baserowResponse.status} ${baserowResponse.statusText}`,
        );
      }

      let data;
      try {
        data = await baserowResponse.json();
        console.log("Baserow API response:", {
          count: data.count,
          resultCount: data.results ? data.results.length : 0,
          firstResult:
            data.results && data.results.length > 0
              ? Object.keys(data.results[0]).join(", ")
              : "No results",
        });
      } catch (jsonError) {
        console.error("Failed to parse JSON response", jsonError);
        throw new Error(
          "Failed to parse Baserow response: " + jsonError.message,
        );
      }

      // Transform the data to match the expected invoice entry format
      const entries = data.results.map((row) => {
        console.log("Processing row:", row);
        return {
          date: row.Date || "",
          start: row.Start || "",
          end: row.End || "",
          hours: row.Hours ? parseFloat(row.Hours) : 0,
          user: row.User && row.User.length > 0 ? row.User[0].value : "",
          notes: row.Notes || "",
          client: row.Client || "",
        };
      });

      console.log(`Processed ${entries.length} entries`);

      const result = {
        entries,
        totalHours: entries.reduce(
          (sum: number, entry: any) => sum + entry.hours,
          0,
        ),
      };

      // Store the result in the database
      await ctx.runMutation(internal.ledger.storeInvoiceResult, {
        requestId: args.requestId,
        result: result,
        status: "completed",
      });
    } catch (error) {
      console.error("Error in fetchInvoiceEntriesAction:", error);
      // Store the error in the database
      await ctx.runMutation(internal.ledger.storeInvoiceResult, {
        requestId: args.requestId,
        result: {
          entries: [],
          totalHours: 0,
          error: error instanceof Error ? error.message : String(error),
        },
        status: "error",
      });
    }
    return null;
  },
});

// Mutation that the client calls to start the fetching process
export const startInvoiceFetch = mutation({
  args: {
    clientName: v.string(),
    startDate: v.string(),
    endDate: v.string(),
  },
  returns: v.object({
    requestId: v.string(),
    status: v.string(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get the Baserow configuration for this user
    const baserowConfig = await ctx.db
      .query("baserowConfig")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();

    if (!baserowConfig) {
      throw new Error("Baserow configuration is missing");
    }

    // Generate a unique ID for this request
    const requestId = `invoice_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    // Store initial state in the database
    const initialState = {
      requestId,
      userId: identity.subject,
      status: "pending",
      createdAt: Date.now(),
      result: {
        entries: [],
        totalHours: 0,
      },
    };

    await ctx.db.insert("invoiceRequests", initialState);

    // Schedule the action to fetch the entries
    await ctx.scheduler.runAfter(0, internal.ledger.fetchInvoiceEntriesAction, {
      clientName: args.clientName,
      startDate: args.startDate,
      endDate: args.endDate,
      baserowApiToken: baserowConfig.apiToken,
      baserowTableId: baserowConfig.tableId,
      requestId: requestId,
    });

    return {
      requestId,
      status: "pending",
    };
  },
});

// Query to get the status and result of a fetch request
export const getInvoiceResult = query({
  args: {
    requestId: v.string(),
  },
  returns: v.object({
    status: v.string(),
    result: v.object({
      entries: v.array(
        v.object({
          date: v.string(),
          start: v.string(),
          end: v.string(),
          hours: v.number(),
          user: v.string(),
          notes: v.string(),
          client: v.string(),
        }),
      ),
      totalHours: v.number(),
      error: v.optional(v.string()),
    }),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const request = await ctx.db
      .query("invoiceRequests")
      .withIndex("by_requestId", (q) => q.eq("requestId", args.requestId))
      .first();

    if (!request) {
      return {
        status: "not_found",
        result: {
          entries: [],
          totalHours: 0,
        },
      };
    }

    if (request.userId !== identity.subject) {
      throw new Error("Unauthorized access to invoice request");
    }

    return {
      status: request.status,
      result: request.result,
    };
  },
});

// Internal mutation to store the result of a fetch operation
export const storeInvoiceResult = internalMutation({
  args: {
    requestId: v.string(),
    status: v.string(),
    result: v.object({
      entries: v.array(
        v.object({
          date: v.string(),
          start: v.string(),
          end: v.string(),
          hours: v.number(),
          user: v.string(),
          notes: v.string(),
          client: v.string(),
        }),
      ),
      totalHours: v.number(),
      error: v.optional(v.string()),
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const request = await ctx.db
      .query("invoiceRequests")
      .withIndex("by_requestId", (q) => q.eq("requestId", args.requestId))
      .first();

    if (!request) {
      console.error(`Request ${args.requestId} not found`);
      return null;
    }

    await ctx.db.patch(request._id, {
      status: args.status,
      result: args.result,
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const fetchEntries = action({
  args: {
    baserowApiToken: v.string(),
    baserowTableId: v.string(),
    beeminderApiToken: v.string(),
    userId: v.string(),
    beforeContent: v.string(),
  },
  returns: v.object({
    newContent: v.string(),
  }),
  handler: async (ctx, args) => {
    // Fetch from Baserow
    const baserowResponse = await fetch(
      "https://" +
        process.env.BASEROW_DOMAIN +
        "/api/database/rows/table/" +
        args.baserowTableId +
        "/?user_field_names=true&filters=%7B%22filter_type%22%3A%22AND%22%2C%22filters%22%3A%5B%7B%22type%22%3A%22higher_than%22%2C%22field%22%3A%22Hours%22%2C%22value%22%3A%220%22%7D%2C%7B%22type%22%3A%22boolean%22%2C%22field%22%3A%22Billable%22%2C%22value%22%3A%221%22%7D%2C%7B%22type%22%3A%22link_row_has%22%2C%22field%22%3A%22User%22%2C%22value%22%3A%222%22%7D%2C%7B%22type%22%3A%22date_is_after%22%2C%22field%22%3A%22Start%22%2C%22value%22%3A%22America%2FNew_York%3F2%3Fnr_weeks_ago%22%7D%5D%2C%22groups%22%3A%5B%5D%7D",
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
      date: row.Date || "",
      hours: row.Hours ? parseFloat(row.Hours) : 0,
      person: row.User && row.User.length > 0 ? row.User[0].value : "",
    }));

    console.log({ baserowEntries });

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
  returns: v.string(),
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
  returns: v.object({
    status: v.string(),
  }),
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
  returns: v.union(
    v.object({
      _id: v.id("ledgerSnapshots"),
      _creationTime: v.number(),
      userId: v.string(),
      timestamp: v.number(),
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
    }),
    v.null(),
  ),
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
