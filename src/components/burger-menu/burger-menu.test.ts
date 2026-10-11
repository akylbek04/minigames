import { describe, expect, it, vi } from "vitest";
import { createBurgerMenu } from "./burger-menu";
import { query } from "../../test/dom";

function setup() {
  const callbacks = { onOpenAuth: vi.fn(), onLogout: vi.fn() };
  const menu = createBurgerMenu(callbacks);
  document.body.append(menu.toggleButton, menu.dialog);
  return { ...menu, ...callbacks };
}

describe("burger menu", () => {
  it("opens from the toggle and closes with its close button", () => {
    const { toggleButton, dialog } = setup();
    toggleButton.click();
    expect(dialog.open).toBe(true);
    expect(toggleButton.getAttribute("aria-expanded")).toBe("true");

    query<HTMLButtonElement>(dialog, ".mobile-menu__close").click();
    expect(toggleButton.getAttribute("aria-expanded")).toBe("false");
  });

  it("closes and opens Auth from the guest buttons", () => {
    const { toggleButton, dialog, onOpenAuth } = setup();
    toggleButton.click();
    query<HTMLButtonElement>(dialog, ".mobile-menu__signup").click();
    query<HTMLButtonElement>(dialog, ".mobile-menu__login").click();

    expect(onOpenAuth.mock.calls).toEqual([["register"], ["login"]]);
    expect(toggleButton.getAttribute("aria-expanded")).toBe("false");
  });

  it("closes on Esc and when a page link is picked", () => {
    const { toggleButton, dialog } = setup();
    toggleButton.click();
    dialog.dispatchEvent(new Event("cancel", { cancelable: true }));
    expect(toggleButton.getAttribute("aria-expanded")).toBe("false");

    toggleButton.click();
    query<HTMLAnchorElement>(dialog, "a.mobile-menu__link").dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
    expect(toggleButton.getAttribute("aria-expanded")).toBe("false");
  });

  it("shows the signed-in profile instead of the guest buttons", () => {
    const { dialog, setSession } = setup();
    setSession({ displayName: "", email: "zoe@rs.school", authenticatedAt: 1 });

    expect(dialog.querySelector(".mobile-menu__login")).toBeNull();
    expect(query(dialog, ".mobile-menu__username").textContent).toBe("zoe");
  });

  it("closes and logs out from the signed-in menu", () => {
    const { toggleButton, dialog, setSession, onLogout } = setup();
    setSession({ displayName: "Zoe", email: "zoe@rs.school", authenticatedAt: 1 });
    toggleButton.click();
    query<HTMLButtonElement>(dialog, ".mobile-menu__logout").click();

    expect(onLogout).toHaveBeenCalledOnce();
    expect(toggleButton.getAttribute("aria-expanded")).toBe("false");
  });
});
