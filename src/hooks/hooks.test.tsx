import { act, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startSession } from "../auth/session";
import { recordActivity } from "../profile/profile-store";
import { dismissSnackbar, showSnackbar, useSnackbars } from "./snackbar-store";
import { useProfile } from "./use-profile";
import { SessionProvider, useSession } from "./use-session";

vi.mock("../auth/firebase", () => ({ firebaseAuth: {} }));
vi.mock("firebase/auth", () => ({ signOut: vi.fn(() => Promise.resolve()) }));

const ANA = { displayName: "Ana Díaz", email: "ana@x.io" };

function Who() {
  const session = useSession();
  return <p>{session ? session.email : "guest"}</p>;
}

describe("useSnackbars", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("shows the newest three, dismisses on demand and after 5 seconds", () => {
    const { result } = renderHook(() => useSnackbars());
    act(() => {
      for (const message of ["a", "b", "c", "d"]) showSnackbar(message, "info");
    });
    expect(result.current.map((item) => item.message)).toEqual(["b", "c", "d"]);

    act(() => dismissSnackbar(result.current[0].id));
    expect(result.current.map((item) => item.message)).toEqual(["c", "d"]);

    act(() => void vi.advanceTimersByTime(5000));
    expect(result.current).toEqual([]);
  });
});

describe("SessionProvider", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("follows login and logout and announces them", async () => {
    render(
      <SessionProvider>
        <Who />
      </SessionProvider>,
    );
    const snackbars = renderHook(() => useSnackbars());
    expect(screen.getByText("guest")).toBeTruthy();

    act(() => void startSession(ANA));
    expect(screen.getByText("ana@x.io")).toBeTruthy();
    expect(snackbars.result.current.map((item) => item.message)).toContain("Welcome, Ana Díaz!");
  });

  it("starts signed in when a valid session is stored", () => {
    startSession(ANA);
    render(
      <SessionProvider>
        <Who />
      </SessionProvider>,
    );
    expect(screen.getByText("ana@x.io")).toBeTruthy();
  });
});

describe("useProfile", () => {
  it("is undefined for guests and follows tracked activity for a user", () => {
    expect(renderHook(() => useProfile(undefined)).result.current).toBeUndefined();

    const { result } = renderHook(() => useProfile("Ana@x.io"));
    expect(result.current?.counts.view).toBe(0);
    act(() => void recordActivity("ana@x.io", "view", "snake"));
    expect(result.current?.counts.view).toBe(1);
    act(() => void recordActivity("bob@x.io", "view", "snake"));
    expect(result.current?.counts.view).toBe(1);
  });
});
