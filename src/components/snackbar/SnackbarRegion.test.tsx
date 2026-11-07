import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { showSnackbar } from "../../hooks/snackbar-store";
import { SnackbarRegion } from "./SnackbarRegion";

it("shows a snackbar, announces errors as alerts, and removes it when dismissed", async () => {
  render(<SnackbarRegion />);
  act(() => {
    showSnackbar("Saved", "success");
    showSnackbar("Broke", "error");
  });
  expect(screen.getByRole("status").textContent).toContain("Saved");
  expect(screen.getByRole("alert").textContent).toContain("Broke");

  await userEvent.click(screen.getAllByRole("button", { name: "Dismiss notification" })[0]);
  await waitFor(() => expect(screen.queryByText("Saved")).toBeNull());
});

it("moves into an open modal dialog so it stays usable", () => {
  render(<SnackbarRegion />);
  const dialog = document.createElement("dialog");
  document.body.append(dialog);
  dialog.showModal();
  act(() => showSnackbar("Over the dialog"));
  expect(dialog.querySelector(".snackbar-region")).not.toBeNull();
});
