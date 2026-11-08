import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { stubApi } from "../../test/api";
import { renderApp } from "../../test/render-app";

vi.mock("../../auth/firebase", () => ({ firebaseAuth: {} }));
vi.mock("firebase/auth", () => ({ signOut: vi.fn(() => Promise.resolve()) }));
vi.mock("../library/LibraryPage", () => ({
  LibraryPage: () => {
    throw new Error("boom");
  },
}));

describe("error page", () => {
  afterEach(() => vi.restoreAllMocks());

  it("replaces a page that throws, keeps the layout and leads Home", async () => {
    stubApi();
    // React reports the caught error; the test expects it.
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { router } = renderApp("/library");

    expect(screen.getByRole("heading", { name: "Something went wrong" })).toBeTruthy();
    expect(screen.queryByText("boom")).toBeNull();
    expect(screen.getByRole("navigation", { name: "Main" })).toBeTruthy();

    await userEvent.click(screen.getByRole("button", { name: "Return to Home Page" }));
    expect(router.state.location.pathname).toBe("/");
    expect(screen.queryByRole("heading", { name: "Something went wrong" })).toBeNull();
  });
});
