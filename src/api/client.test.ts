import { describe, expect, it, vi } from "vitest";
import { ApiError, getJson, isAbortError } from "./client";

const API = "https://faxb76kxra.execute-api.eu-central-1.amazonaws.com/api";

function stubFetch(response: Response | Error): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn(() =>
    response instanceof Error ? Promise.reject(response) : Promise.resolve(response),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("getJson", () => {
  it("builds the URL from the path and skips undefined params", async () => {
    const fetchMock = stubFetch(Response.json({ data: [1] }));

    await expect(getJson("/games", { featured: "true", page: undefined })).resolves.toEqual({
      data: [1],
    });
    expect(fetchMock).toHaveBeenCalledWith(`${API}/games?featured=true`, { signal: undefined });
  });

  it("turns an error response into an ApiError with the server message", async () => {
    stubFetch(Response.json({ error: "Game not found: x" }, { status: 404 }));

    const request = getJson("/games/x");
    await expect(request).rejects.toBeInstanceOf(ApiError);
    await expect(request).rejects.toMatchObject({
      status: 404,
      message: "Game not found: x",
      isNotFound: true,
    });
  });

  it("falls back to a generic message for non-JSON errors", async () => {
    stubFetch(new Response("<html>", { status: 502 }));

    await expect(getJson("/games")).rejects.toMatchObject({
      status: 502,
      message: "Request failed with status 502",
      isNotFound: false,
    });
  });

  it("reports rate limiting", async () => {
    stubFetch(Response.json({ error: "Rate limit exceeded" }, { status: 429 }));

    await expect(getJson("/games")).rejects.toMatchObject({ isRateLimited: true });
  });

  it("maps a failed connection to status 0 but lets aborts through", async () => {
    stubFetch(new TypeError("Failed to fetch"));
    await expect(getJson("/games")).rejects.toMatchObject({ status: 0 });

    stubFetch(new DOMException("Aborted", "AbortError"));
    await expect(getJson("/games")).rejects.toSatisfy(isAbortError);
  });
});
