const API_BASE_URL = "https://faxb76kxra.execute-api.eu-central-1.amazonaws.com/api";

// Status 0 means the request never got a response (offline, DNS, CORS,
// timeout).
const NETWORK_ERROR_STATUS = 0;
const TOO_MANY_REQUESTS_STATUS = 429;
const SERVER_ERROR_STATUS = 500;
// A change request that takes longer is given up on (its outcome unknown).
const MUTATION_TIMEOUT = 15_000;

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }

  // 400 (rejected query values) and 404 (unknown slug) mean the requested
  // data does not exist, which the UI shows as an empty state, not a failure.
  get isNotFound(): boolean {
    return this.status === 400 || this.status === 404;
  }

  get isRateLimited(): boolean {
    return this.status === TOO_MANY_REQUESTS_STATUS;
  }

  // No answer, or a server failure: a change may or may not have been
  // applied, so it must not be resent automatically.
  get isOutcomeUnknown(): boolean {
    return this.status === NETWORK_ERROR_STATUS || this.status >= SERVER_ERROR_STATUS;
  }
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export type QueryParams = Record<string, string | undefined>;

function buildUrl(path: string, params: QueryParams): string {
  const url = new URL(`${API_BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(key, value);
    }
  }
  return url.href;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (typeof body === "object" && body !== null && "error" in body) {
      return String(body.error);
    }
  } catch {
    // Not JSON (e.g. a gateway error page): fall through to the generic text.
  }
  return `Request failed with status ${response.status}`;
}

async function request<T>(url: string, init: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    throw new ApiError("Network error: check your connection", NETWORK_ERROR_STATUS);
  }

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }
  return (await response.json()) as T;
}

export function getJson<T>(
  path: string,
  params: QueryParams = {},
  signal?: AbortSignal,
): Promise<T> {
  return request<T>(buildUrl(path, params), { signal });
}

export function postJson<T>(path: string, body: unknown): Promise<T> {
  return request<T>(buildUrl(path, {}), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(MUTATION_TIMEOUT),
  });
}
