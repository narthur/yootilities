import { describe, it, expect } from "vitest";
import { parseLedger, mergeEntries, generateLedger } from "./ledger";

describe("ledger", () => {
  describe("parseLedger", () => {
    it("should parse valid ledger entries", () => {
      const input = `iou[2024.03.15, 2*35, ppd, la, "hours"]
iou[2024.03.14, 1.5*35, ppd, na, "hours"]`;

      const result = parseLedger(input);

      expect(result).toEqual([
        {
          date: "2024.03.15",
          hours: 2,
          rate: 35,
          account: "la",
          comment: "hours",
        },
        {
          date: "2024.03.14",
          hours: 1.5,
          rate: 35,
          account: "na",
          comment: "hours",
        },
      ]);
    });

    it("should ignore invalid lines", () => {
      const input = `some random text
iou[2024.03.15, 2*35, ppd, la, "hours"]
another invalid line`;

      const result = parseLedger(input);

      expect(result).toEqual([
        {
          date: "2024.03.15",
          hours: 2,
          rate: 35,
          account: "la",
          comment: "hours",
        },
      ]);
    });
  });

  describe("mergeEntries", () => {
    it("should merge entries from all sources without duplicates", () => {
      const currentEntries = [
        {
          date: "2024.03.15",
          hours: 2,
          rate: 35,
          account: "la",
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
          hours: 4,
          rate: 35,
          account: "na",
          comment: "hours",
        },
        {
          date: "2024.03.16",
          hours: 3,
          rate: 35,
          account: "la",
          comment: "hours",
        },
        {
          date: "2024.03.15",
          hours: 2,
          rate: 35,
          account: "la",
          comment: "hours",
        },
      ]);
    });

    it("should not add duplicate entries", () => {
      const currentEntries = [
        {
          date: "2024.03.15",
          hours: 2,
          rate: 35,
          account: "la",
          comment: "hours",
        },
      ];

      const baserowEntries = [
        {
          date: "2024-03-15", // Same date as current entry
          hours: 3,
          person: "Luke",
        },
      ];

      const result = mergeEntries(currentEntries, baserowEntries, []);

      expect(result).toEqual([
        {
          date: "2024.03.15",
          hours: 2,
          rate: 35,
          account: "la",
          comment: "hours",
        },
      ]);
    });
  });

  describe("generateLedger", () => {
    it("should generate ledger content from entries", () => {
      const entries = [
        {
          date: "2024.03.15",
          hours: 2,
          rate: 35,
          account: "la",
          comment: "hours",
        },
        {
          date: "2024.03.14",
          hours: 1.5,
          rate: 35,
          account: "na",
          comment: "hours",
        },
      ];

      const result = generateLedger(entries);

      expect(result).toBe(
        'iou[2024.03.15, 2*35, ppd, la, "hours"]\n' +
        'iou[2024.03.14, 1.5*35, ppd, na, "hours"]'
      );
    });
  });
});
