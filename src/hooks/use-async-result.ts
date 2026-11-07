import { useEffect, useEffectEvent, useState } from "react";
import { ApiError, isAbortError } from "../api/client";
import {
  notifyRequestFailed,
  notifyRequestRecovered,
} from "../components/feedback/request-notices";

export type AsyncResult<T> =
  | { status: "loading" }
  | { status: "ready"; data: T }
  | { status: "not-found" }
  // `retry` resends the same request.
  | { status: "error"; error: unknown; retry: () => void };

interface UseAsyncResultOptions<T> {
  // Names the data in snackbar messages, e.g. "featured games".
  subject: string;
  // A new key starts a new request and aborts the previous one.
  requestKey: string;
  // Undefined while the request can't be sent yet (it waits on other data):
  // the result stays "loading" meanwhile.
  request?: (signal: AbortSignal) => Promise<T>;
  // 400/404 answers mean the requested thing doesn't exist. Without this
  // they are treated like any other failed request.
  canShowNotFound?: boolean;
}

type Settled<T> =
  | { key: string; status: "ready"; data: T }
  | { key: string; status: "not-found" }
  | { key: string; status: "error"; error: unknown };

// Runs one request per key, newest wins: starting a new one aborts the
// previous, so a slow stale response can never overwrite a newer one.
export function useAsyncResult<T>({
  subject,
  requestKey,
  request,
  canShowNotFound = false,
}: UseAsyncResultOptions<T>): AsyncResult<T> {
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<Settled<T>>();
  const key = `${requestKey}#${attempt}`;
  const hasRequest = request !== undefined;

  // Always the latest request function, without restarting the effect.
  const send = useEffectEvent((signal: AbortSignal) => request!(signal));

  useEffect(() => {
    if (!hasRequest) {
      return;
    }
    const controller = new AbortController();
    void (async () => {
      try {
        const data = await send(controller.signal);
        if (controller.signal.aborted) {
          return;
        }
        setSettled({ key, status: "ready", data });
        if (attempt > 0) {
          notifyRequestRecovered(subject);
        }
      } catch (error) {
        if (controller.signal.aborted || isAbortError(error)) {
          return;
        }
        if (canShowNotFound && error instanceof ApiError && error.isNotFound) {
          setSettled({ key, status: "not-found" });
          return;
        }
        setSettled({ key, status: "error", error });
        notifyRequestFailed(subject, error);
      }
    })();
    return () => controller.abort();
  }, [key, attempt, hasRequest, canShowNotFound, subject]);

  // A result that belongs to an older key is stale: it counts as loading.
  if (settled?.key !== key) {
    return { status: "loading" };
  }
  if (settled.status === "error") {
    return {
      status: "error",
      error: settled.error,
      retry: () => setAttempt((count) => count + 1),
    };
  }
  return settled.status === "ready"
    ? { status: "ready", data: settled.data }
    : { status: "not-found" };
}
