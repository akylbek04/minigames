import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../../api/client";
import { AsyncContent } from "./AsyncContent";

function setup(request: (signal: AbortSignal) => Promise<string[]>, extra = {}) {
  return render(
    <AsyncContent
      subject="games"
      requestKey="k"
      request={request}
      renderLoading={() => <p>loading</p>}
      renderData={(rows) => <p>{rows.join(",")}</p>}
      {...extra}
    />,
  );
}

describe("AsyncContent", () => {
  it("shows loading, then the data", async () => {
    setup(() => Promise.resolve(["a", "b"]));
    expect(screen.getByText("loading")).toBeTruthy();
    expect(await screen.findByText("a,b")).toBeTruthy();
  });

  it("shows the empty and not-found placeholders when asked for", async () => {
    setup(() => Promise.resolve([]), {
      isEmpty: (rows: string[]) => rows.length === 0,
      renderEmpty: () => <p>nothing</p>,
    });
    expect(await screen.findByText("nothing")).toBeTruthy();

    setup(() => Promise.reject(new ApiError("gone", 404)), {
      renderNotFound: () => <p>missing</p>,
    });
    expect(await screen.findByText("missing")).toBeTruthy();
  });

  it("explains a failure and resends the same request on retry", async () => {
    const request = vi
      .fn<() => Promise<string[]>>()
      .mockRejectedValueOnce(new ApiError("down", 0))
      .mockResolvedValueOnce(["ok"]);
    setup(request);

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByText(/couldn't reach the server/i)).toBeTruthy();

    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(await screen.findByText("ok")).toBeTruthy();
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("aborts the previous request when the key changes", async () => {
    const signals: AbortSignal[] = [];
    const request = (signal: AbortSignal) => {
      signals.push(signal);
      return new Promise<string[]>(() => {});
    };
    const view = setup(request);
    view.rerender(
      <AsyncContent
        subject="games"
        requestKey="other"
        request={request}
        renderLoading={() => <p>loading</p>}
        renderData={() => <p />}
      />,
    );
    await act(async () => {});
    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);
  });
});
