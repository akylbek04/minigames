import { describe, expect, it } from "vitest";
import { formatCompactNumber, formatRelativeTime } from "./format";

const NOW = Date.parse("2026-10-11T12:00:00Z");
const ago = (ms: number): string => new Date(NOW - ms).toISOString();
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("formatCompactNumber", () => {
  it("keeps small numbers and shortens large ones to one decimal", () => {
    expect(formatCompactNumber(999)).toBe("999");
    expect(formatCompactNumber(31_200)).toBe("31.2K");
    expect(formatCompactNumber(1_500_000)).toBe("1.5M");
  });
});

describe("formatRelativeTime", () => {
  it.each([
    [ago(30_000), "just now"],
    [ago(5 * MINUTE), "5 min ago"],
    [ago(HOUR), "1 hour ago"],
    [ago(3 * HOUR), "3 hours ago"],
    [ago(DAY), "1 day ago"],
    [ago(8 * DAY), "1 week ago"],
    [ago(22 * DAY), "3 weeks ago"],
    ["2026-08-01T12:00:00Z", "2 months ago"],
    ["2024-09-01T12:00:00Z", "2 years ago"],
  ])("formats %s as %s", (iso, expected) => {
    expect(formatRelativeTime(iso, NOW)).toBe(expected);
  });

  it("treats future dates as just now and invalid ones as empty", () => {
    expect(formatRelativeTime(new Date(NOW + HOUR).toISOString(), NOW)).toBe("just now");
    expect(formatRelativeTime("not a date", NOW)).toBe("");
  });
});
