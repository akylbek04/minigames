import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { signOutFromFirebase } from "./auth-service";

vi.mock("./auth-service", () => ({ signOutFromFirebase: vi.fn() }));

type SessionModule = typeof import("./session");
type SessionListener = Parameters<SessionModule["onSessionChange"]>[0];

const KEY = "minigames:akylbek04-minigames:app-session";
const NOW = 1_800_000_000_000;
const MINUTE = 60_000;
const PROFILE = { displayName: "Alex", email: "alex@rs.school" };

function store(value: unknown): void {
  localStorage.setItem(KEY, typeof value === "string" ? value : JSON.stringify(value));
}

describe("app session", () => {
  let session: SessionModule;
  let changes: Mock<SessionListener>;

  beforeEach(async () => {
    vi.useFakeTimers({ now: NOW });
    vi.mocked(signOutFromFirebase).mockResolvedValue();
    vi.resetModules();
    session = await import("./session");
    changes = vi.fn<SessionListener>();
    session.onSessionChange(changes);
    return () => vi.useRealTimers();
  });

  it("stores only the profile and a fixed sign-in time under the namespaced key", () => {
    session.startSession({ ...PROFILE, avatarUrl: "https://img/a" });

    expect(session.SESSION_STORAGE_KEY).toBe(KEY);
    expect(JSON.parse(localStorage.getItem(KEY) ?? "")).toEqual({
      ...PROFILE,
      avatarUrl: "https://img/a",
      authenticatedAt: NOW,
    });
    expect(changes).toHaveBeenCalledWith(expect.objectContaining(PROFILE), "login");
  });

  it("omits avatarUrl when the profile has none", () => {
    session.startSession(PROFILE);
    expect(JSON.parse(localStorage.getItem(KEY) ?? "")).not.toHaveProperty("avatarUrl");
  });

  it("restores a valid stored session once, without changing its time", () => {
    store({ ...PROFILE, authenticatedAt: NOW - 2 * MINUTE });

    expect(session.getActiveSession()).toEqual({ ...PROFILE, authenticatedAt: NOW - 2 * MINUTE });
    session.getActiveSession();

    expect(changes).toHaveBeenCalledOnce();
    expect(changes).toHaveBeenCalledWith(expect.anything(), "restore");
    expect(JSON.parse(localStorage.getItem(KEY) ?? "").authenticatedAt).toBe(NOW - 2 * MINUTE);
  });

  it("expires 5 minutes after sign-in, removing only its own key", () => {
    localStorage.setItem("other-app", "keep");
    store({ ...PROFILE, authenticatedAt: NOW - 5 * MINUTE });

    expect(session.getActiveSession()).toBeUndefined();
    expect(localStorage.getItem(KEY)).toBeNull();
    expect(localStorage.getItem("other-app")).toBe("keep");
    expect(signOutFromFirebase).toHaveBeenCalledOnce();
    expect(changes).toHaveBeenCalledWith(undefined, "expired");
  });

  it("reports one expiry event when the lifetime runs out", () => {
    session.startSession(PROFILE);
    vi.advanceTimersByTime(5 * MINUTE);

    expect(changes).toHaveBeenLastCalledWith(undefined, "expired");
    expect(session.getActiveSession()).toBeUndefined();
    expect(changes.mock.calls.filter(([, change]) => change === "expired")).toHaveLength(1);
  });

  it.each([
    ["not JSON", "{oops"],
    ["not an object", "42"],
    ["missing email", JSON.stringify({ displayName: "A", authenticatedAt: NOW })],
    ["wrong type", JSON.stringify({ ...PROFILE, authenticatedAt: String(NOW) })],
    ["future time", JSON.stringify({ ...PROFILE, authenticatedAt: NOW + MINUTE })],
    ["bad avatar", JSON.stringify({ ...PROFILE, authenticatedAt: NOW, avatarUrl: 1 })],
  ])("treats a stored value that is %s as invalid", (_, raw) => {
    store(raw);

    expect(session.getActiveSession()).toBeUndefined();
    expect(localStorage.getItem(KEY)).toBeNull();
    expect(signOutFromFirebase).toHaveBeenCalledOnce();
    expect(changes).toHaveBeenCalledWith(undefined, "invalid");
  });

  it("notices a session record deleted while the app is signed in", () => {
    session.startSession(PROFILE);
    localStorage.removeItem(KEY);

    expect(session.getActiveSession()).toBeUndefined();
    expect(changes).toHaveBeenLastCalledWith(undefined, "invalid");
  });

  it("stays a guest without events when nothing is stored", () => {
    expect(session.getActiveSession()).toBeUndefined();
    expect(changes).not.toHaveBeenCalled();
    expect(signOutFromFirebase).not.toHaveBeenCalled();
  });

  it("logs out to Guest Mode even when Firebase sign-out fails", async () => {
    session.startSession(PROFILE);
    vi.mocked(signOutFromFirebase).mockRejectedValue(new Error("offline"));

    await expect(session.endSession("logout")).rejects.toThrow("offline");
    expect(localStorage.getItem(KEY)).toBeNull();
    expect(changes).toHaveBeenLastCalledWith(undefined, "logout");
    expect(session.getActiveSession()).toBeUndefined();
  });

  it("swallows a failed Firebase sign-out on automatic expiry", async () => {
    vi.mocked(signOutFromFirebase).mockRejectedValue(new Error("offline"));
    store({ ...PROFILE, authenticatedAt: NOW - 10 * MINUTE });

    expect(session.getActiveSession()).toBeUndefined();
    await vi.runAllTimersAsync();
    expect(changes).toHaveBeenCalledWith(undefined, "expired");
  });
});
