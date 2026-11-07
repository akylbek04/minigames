import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { AnimatedDialog } from "./AnimatedDialog";

it("opens with isOpen and asks to close on Esc and backdrop clicks only", async () => {
  const onRequestClose = vi.fn();
  const { container } = render(
    <AnimatedDialog isOpen onRequestClose={onRequestClose} className="d" labelledBy="t">
      <h2 id="t">Title</h2>
    </AnimatedDialog>,
  );
  const dialog = container.querySelector("dialog")!;
  expect(dialog.open).toBe(true);

  await userEvent.click(screen.getByText("Title"));
  expect(onRequestClose).not.toHaveBeenCalled();

  await userEvent.click(dialog);
  dialog.dispatchEvent(new Event("cancel", { cancelable: true }));
  expect(onRequestClose).toHaveBeenCalledTimes(2);
});
