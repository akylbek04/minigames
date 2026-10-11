import { describe, expect, it, vi } from "vitest";
import { createHeader } from "./header";
import { query } from "../../test/dom";

const SESSION = { displayName: "Ana Maria", email: "ana@rs.school", authenticatedAt: 1 };

function setup(): ReturnType<typeof createHeader> & { onOpenAuth: ReturnType<typeof vi.fn> } {
  const onOpenAuth = vi.fn();
  const header = createHeader({ onOpenAuth, menuToggle: document.createElement("button") });
  return { ...header, onOpenAuth };
}

describe("header", () => {
  it("offers Log In and Sign Up to guests", () => {
    const { element, onOpenAuth } = setup();
    query<HTMLButtonElement>(element, ".header__login").click();
    query<HTMLButtonElement>(element, ".header__signup").click();
    expect(onOpenAuth.mock.calls).toEqual([["login"], ["register"]]);
  });

  it("replaces the guest controls with the signed-in profile", () => {
    const { element, setSession } = setup();
    setSession(SESSION);

    expect(element.querySelector(".header__login")).toBeNull();
    expect(query(element, ".header__username").textContent).toBe("Ana Maria");
    expect(query(element, ".user-avatar").textContent).toBe("AM");
  });

  it("renders the name as text, never as markup", () => {
    const { element, setSession } = setup();
    setSession({ ...SESSION, displayName: "<img src=x onerror=alert(1)>" });

    expect(query(element, ".header__username").textContent).toBe("<img src=x onerror=alert(1)>");
    expect(query(element, ".header__username").children).toHaveLength(0);
  });

  it("goes back to guest controls when the session ends", () => {
    const { element, setSession } = setup();
    setSession(SESSION);
    setSession(undefined);
    expect(element.querySelector(".header__profile")).toBeNull();
    expect(element.querySelector(".header__login")).not.toBeNull();
  });
});
