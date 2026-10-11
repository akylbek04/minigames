import { describe, expect, it } from "vitest";
import { getCommentAuthorName, getInitials, getProfileName } from "./profile";

describe("getProfileName", () => {
  it("prefers the displayName, then the email local part, then a generic name", () => {
    expect(getProfileName({ displayName: "  Alex  ", email: "a@rs.school" })).toBe("Alex");
    expect(getProfileName({ displayName: " ", email: "jdoe@rs.school" })).toBe("jdoe");
    expect(getProfileName({ displayName: "", email: "" })).toBe("Player");
  });
});

describe("getInitials", () => {
  it.each([
    ["alex", "A"],
    ["ana maria lopez", "AM"],
    ["  john   smith ", "JS"],
    ["ömer çelik", "ÖÇ"],
    ["李 小龙", "李小"],
    ["_neo 2pac", "N2"],
    ["!!! ???", ""],
    ["", ""],
  ])("turns %j into %j", (name, initials) => expect(getInitials(name)).toBe(initials));
});

describe("getCommentAuthorName", () => {
  it("uses a displayName of 2–30 characters as is", () => {
    expect(getCommentAuthorName({ displayName: "Forest Dweller", email: "f@x.io" })).toBe(
      "Forest Dweller",
    );
  });

  it("falls back to the email local part when the displayName is too short", () => {
    expect(getCommentAuthorName({ displayName: "A", email: "alex@x.io" })).toBe("alex");
  });

  it("trims long names to the 30 characters the API accepts", () => {
    const name = getCommentAuthorName({ displayName: "N".repeat(40), email: "n@x.io" });
    expect(name).toBe("N".repeat(30));
  });

  it("uses a generic name when nothing else fits", () => {
    expect(getCommentAuthorName({ displayName: "", email: "a@x.io" })).toBe("Player");
  });
});
