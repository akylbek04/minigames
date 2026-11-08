import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, useLocation } from "react-router";
import { expect, it } from "vitest";
import { useOverlay } from "./use-overlay";

function setup(url: string) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>
  );
  return renderHook(() => ({ overlay: useOverlay("game"), location: useLocation() }), { wrapper });
}

it("reads, opens and switches the value in the query, keeping other parameters", () => {
  const { result } = setup("/library?page=2");
  expect(result.current.overlay.value).toBeUndefined();

  act(() => result.current.overlay.open("snake"));
  expect(result.current.location.search).toBe("?page=2&game=snake");
  expect(result.current.location.state).toEqual({ overlay: "game" });

  act(() => result.current.overlay.change("tetris"));
  expect(result.current.overlay.value).toBe("tetris");
});

it("closes a deep-linked dialog by dropping its parameter in place", () => {
  const { result } = setup("/library?game=snake&page=2");
  act(() => result.current.overlay.close());
  expect(result.current.location.search).toBe("?page=2");
});
