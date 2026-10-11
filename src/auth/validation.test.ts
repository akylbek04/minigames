import { describe, expect, it } from "vitest";
import {
  validateConfirmPassword,
  validateEmail,
  validateLoginPassword,
  validateRegisterPassword,
  validateUsername,
} from "./validation";

describe("validateEmail", () => {
  it.each(["alex@rs.school", "first.last+tag@mail.example.com", " padded@rs.school "])(
    "accepts %s",
    (email) => expect(validateEmail(email)).toBeUndefined(),
  );

  it.each([
    ["", "Email is required."],
    ["alex", "Enter a valid email, e.g. name@example.com."],
    ["alex@rs", "Enter a valid email, e.g. name@example.com."],
    ["a b@rs.school", "Enter a valid email, e.g. name@example.com."],
  ])("rejects %j", (email, message) => expect(validateEmail(email)).toBe(message));
});

describe("validateUsername", () => {
  it.each(["Al", "CozyGamer99", "A".repeat(30)])("accepts %s", (name) =>
    expect(validateUsername(name)).toBeUndefined(),
  );

  it.each([
    ["", "Username is required."],
    ["A", "Username must be 2–30 characters long."],
    ["A".repeat(31), "Username must be 2–30 characters long."],
    ["cozyGamer", "Username must start with an uppercase English letter."],
    ["Ölaf", "Username must start with an uppercase English letter."],
    ["Cozy_Gamer", "Use English letters and digits only."],
    ["Cozy Gamer", "Use English letters and digits only."],
  ])("rejects %j", (name, message) => expect(validateUsername(name)).toBe(message));
});

describe("validateRegisterPassword", () => {
  it("accepts a password with an uppercase letter, a digit and a special character", () => {
    expect(validateRegisterPassword("Secr3t!")).toBeUndefined();
  });

  it.each([
    ["", "Password is required."],
    ["Ab1!", "Password must be at least 6 characters long."],
    ["Secr3t! x", "Use English letters, digits and special characters only."],
    ["Пароль1!", "Use English letters, digits and special characters only."],
    ["secr3t!", "Add at least one uppercase English letter."],
    ["Secret!", "Add at least one digit."],
    ["Secr3t", "Add at least one special character, e.g. !@#$."],
  ])("rejects %j", (password, message) => expect(validateRegisterPassword(password)).toBe(message));
});

describe("validateLoginPassword", () => {
  it("only requires 6 characters, not registration strength", () => {
    expect(validateLoginPassword("simple")).toBeUndefined();
    expect(validateLoginPassword("")).toBe("Password is required.");
    expect(validateLoginPassword("short")).toBe("Password must be at least 6 characters long.");
  });
});

describe("validateConfirmPassword", () => {
  it("only checks that it matches the password", () => {
    expect(validateConfirmPassword("abc", "abc")).toBeUndefined();
    expect(validateConfirmPassword("", "Secr3t!")).toBe("Please confirm your password.");
    expect(validateConfirmPassword("Secr3t", "Secr3t!")).toBe("Passwords do not match.");
  });
});
