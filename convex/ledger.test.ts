import { describe, it, expect } from "vitest";
import { parseLedger, mergeEntries, generateLedger } from "./ledger";

describe("ledger", () => {
  describe("parseLedger", () => {
    it("should parse valid ledger entries", () => {
      const input = `iou[2025.05.09, 25/60*20, b, t, "dishes, kitchen clean-up"]
iou[2025.05.08, 550, shared, corp, "cash transfer"]`;

      const result = parseLedger(input);

      expect(result).toEqual([
        {
          date: "2025.05.09",
          amount: "25/60*20",
          from: "b",
          to: "t",
          comment: "dishes, kitchen clean-up",
        },
        {
          date: "2025.05.08",
          amount: "550",
          from: "shared",
          to: "corp",
          comment: "cash transfer",
        },
      ]);
    });

    it("should ignore non-iou lines", () => {
      const input = `account[b, "Bill", "email@example.com"]
iou[2025.05.09, 25/60*20, b, t, "dishes, kitchen clean-up"]
(* Some comment *)`;

      const result = parseLedger(input);

      expect(result).toEqual([
        {
          date: "2025.05.09",
          amount: "25/60*20",
          from: "b",
          to: "t",
          comment: "dishes, kitchen clean-up",
        },
      ]);
    });

    it("should throw on invalid iou format", () => {
      const input = `iou[invalid format]`;
      expect(() => parseLedger(input)).toThrow("Invalid line format");
    });
  });

  describe("mergeEntries", () => {
    it("should merge entries from all sources without duplicates", () => {
      const currentEntries = [
        {
          date: "2024.03.15",
          amount: "2*35",
          from: "shared",
          to: "la",
          comment: "hours",
        },
      ];

      const baserowEntries = [
        {
          date: "2024-03-16",
          hours: 3,
          person: "Luke",
        },
      ];

      const beeminderEntries = [
        {
          date: "2024.03.17",
          hours: 4,
        },
      ];

      const result = mergeEntries(currentEntries, baserowEntries, beeminderEntries);

      expect(result).toEqual([
        {
          date: "2024.03.17",
          amount: "4*35",
          from: "shared",
          to: "na",
          comment: "hours",
        },
        {
          date: "2024.03.16",
          amount: "3*35",
          from: "shared",
          to: "la",
          comment: "hours",
        },
        {
          date: "2024.03.15",
          amount: "2*35",
          from: "shared",
          to: "la",
          comment: "hours",
        },
      ]);
    });
  });

  describe("generateLedger", () => {
    it("should generate ledger content from entries", () => {
      const entries = [
        {
          date: "2025.05.09",
          amount: "25/60*20",
          from: "b",
          to: "t",
          comment: "dishes, kitchen clean-up",
        },
      ];

      const result = generateLedger(entries);

      expect(result).toBe(
        'iou[2025.05.09, 25/60*20, b, t, "dishes, kitchen clean-up"]'
      );
    });
  });
});
