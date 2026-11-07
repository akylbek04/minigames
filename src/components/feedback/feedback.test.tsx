import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { EmptyState } from "./EmptyState";
import { ErrorBanner } from "./ErrorBanner";
import { SkeletonGroup } from "./Skeletons";

it("announces an error banner and retries on click", async () => {
  const onRetry = vi.fn();
  render(<ErrorBanner message="Down" onRetry={onRetry} />);
  await userEvent.click(screen.getByRole("button", { name: /try again/i }));
  expect(onRetry).toHaveBeenCalledOnce();
  expect(screen.getByRole("alert").textContent).toContain("Something went wrong");
});

it("shows an empty state with an optional action", async () => {
  const onClick = vi.fn();
  render(<EmptyState title="None" message="Nothing here" action={{ label: "Reset", onClick }} />);
  await userEvent.click(screen.getByRole("button", { name: "Reset" }));
  expect(onClick).toHaveBeenCalledOnce();
});

it("gives a skeleton group one loading label", () => {
  render(<SkeletonGroup label="Loading games">x</SkeletonGroup>);
  expect(screen.getByRole("status").textContent).toContain("Loading games");
});
