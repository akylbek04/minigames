import { describe, expect, it } from "vitest";
import { createUserAvatar } from "./user-avatar";

describe("user avatar", () => {
  it("shows the profile photo when there is one", () => {
    const avatar = createUserAvatar({ displayName: "Alex", email: "a@x.io", avatarUrl: "/a.png" });
    expect(avatar).toBeInstanceOf(HTMLImageElement);
    expect(avatar.getAttribute("src")).toBe("/a.png");
  });

  it("falls back to initials when the photo fails to load", () => {
    const avatar = createUserAvatar({
      displayName: "Ana Maria",
      email: "a@x.io",
      avatarUrl: "/broken.png",
    });
    document.body.append(avatar);
    avatar.dispatchEvent(new Event("error"));

    expect(document.body.textContent).toBe("AM");
    expect(document.querySelector("img")).toBeNull();
  });

  it("uses the email name for initials when displayName is empty", () => {
    expect(createUserAvatar({ displayName: "", email: "zoe@x.io" }).textContent).toBe("Z");
  });

  it("shows a generic icon when the name has no letters or digits", () => {
    const avatar = createUserAvatar({ displayName: "~~~", email: "a@x.io" });
    expect(avatar.querySelector(".material-symbols-outlined")?.textContent).toBe("person");
  });
});
