import { act, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startSession } from "../auth/session";
import { recordActivity } from "../profile/profile-store";
import { dismissSnackbar, removeSnackbar, showSnackbar, useSnackbars } from "./snackbar-store";
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

  it("keeps the newest three, then dismisses and removes on demand", () => {
    const { result } = renderHook(() => useSnackbars());
    const staying = () =>
      result.current.filter((item) => !item.isLeaving).map((item) => item.message);
    act(() => {
      for (const message of ["a", "b", "c", "d"]) showSnackbar(message, "info");
    });
    expect(staying()).toEqual(["b", "c", "d"]);

    act(() => dismissSnackbar(result.current[1].id));
    expect(staying()).toEqual(["c", "d"]);
    expect(result.current).toHaveLength(4);

    act(() => removeSnackbar(result.current[0].id));
    expect(result.current).toHaveLength(3);
  });

  it("starts leaving by itself after 5 seconds", () => {
    const { result } = renderHook(() => useSnackbars());
    act(() => showSnackbar("later"));
    act(() => void vi.advanceTimersByTime(5000));
    expect(result.current.find((item) => item.message === "later")?.isLeaving).toBe(true);
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
