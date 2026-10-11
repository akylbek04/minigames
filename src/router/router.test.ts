import { beforeEach, describe, expect, it, vi } from "vitest";

type Router = typeof import("./router");

// The router keeps module-level state, so every test gets a fresh copy
// that reads the URL set up just before it.
async function loadRouter(url = "/"): Promise<Router> {
  history.replaceState(undefined, "", url);
  vi.resetModules();
  return import("./router");
}

describe("router", () => {
  let router: Router;

  beforeEach(async () => {
    router = await loadRouter();
  });

  it("resolves known paths and unknown ones to not-found", async () => {
    expect(router.getLocation().route).toBe("home");
    expect((await loadRouter("/library/?page=2")).getLocation()).toMatchObject({
      route: "library",
    });
    expect((await loadRouter("/nope")).getLocation().route).toBe("not-found");
  });

  it("renders the start URL and notifies listeners on navigation", () => {
    const listener = vi.fn();
    router.onRouteChange(listener);
    router.startRouter();
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ route: "home" }), undefined);

    router.navigateTo("/library?page=3");
    expect(location.pathname).toBe("/library");
    const [current, previous] = listener.mock.lastCall ?? [];
    expect(current.query.get("page")).toBe("3");
    expect(previous.route).toBe("home");
  });

  it("ignores navigation to the current URL", () => {
    const listener = vi.fn();
    router.onRouteChange(listener);
    router.navigate(location.href);
    expect(listener).not.toHaveBeenCalled();
  });

  it("updates only the given query keys and can replace the entry", () => {
    router.navigate("/?game=a&sort=x");
    const length = history.length;
    router.updateQuery({ game: undefined, page: "2" }, { replace: true });
    expect(location.search).toBe("?sort=x&page=2");
    expect(history.length).toBe(length);
  });

  it("closes an in-app overlay by going back and a deep-linked one by replacing", () => {
    const back = vi.spyOn(history, "back").mockImplementation(() => {});
    router.openOverlay("game", "tiny-glade");
    expect(location.search).toBe("?game=tiny-glade");
    router.closeOverlay("game");
    expect(back).toHaveBeenCalledOnce();

    router.navigate("/?auth=login", { replace: true });
    router.closeOverlay("auth");
    expect(location.search).toBe("");
  });
});
