import { useEffect, useEffectEvent, useState, type ReactNode } from "react";
import { ApiError, isAbortError } from "../../api/client";
import { ErrorBanner } from "./ErrorBanner";
import {
  describeRequestError,
  notifyRequestFailed,
  notifyRequestRecovered,
} from "./request-notices";

export type AsyncContentState = "loading" | "ready" | "empty" | "not-found" | "error";

interface AsyncContentProps<T> {
  // Names the data in snackbar messages, e.g. "featured games".
  subject: string;
  // A new key starts a new request and aborts the previous one.
  requestKey: string;
  // Undefined while the request can't be sent yet (it waits on other data):
  // the loading state shows meanwhile.
  request?: (signal: AbortSignal) => Promise<T>;
  renderLoading: () => ReactNode;
  renderData: (data: T) => ReactNode;
  isEmpty?: (data: T) => boolean;
  renderEmpty?: () => ReactNode;
  // For 400/404 answers: the requested thing doesn't exist. Without it they
  // are treated like any other failed request.
  renderNotFound?: () => ReactNode;
  onStateChange?: (state: AsyncContentState) => void;
  className?: string;
}

type Result<T> =
  | { key: string; status: "ready"; data: T }
  | { key: string; status: "not-found" }
  | { key: string; status: "error"; error: unknown };

// One content area that cycles through the shared feedback states: skeleton
// while pending, then the data, an empty/not-found placeholder, or an error
// banner whose retry re-sends the same request. A new request aborts the
// previous one, so a slow stale response can never overwrite a newer one.
export function AsyncContent<T>({
  subject,
  requestKey,
  request,
  renderLoading,
  renderData,
  isEmpty,
  renderEmpty,
  renderNotFound,
  onStateChange,
  className,
}: AsyncContentProps<T>) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result<T>>();
  const key = `${requestKey}#${attempt}`;
  const hasRequest = request !== undefined;
  const canShowNotFound = renderNotFound !== undefined;

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
        setResult({ key, status: "ready", data });
        if (attempt > 0) {
          notifyRequestRecovered(subject);
        }
      } catch (error) {
        if (controller.signal.aborted || isAbortError(error)) {
          return;
        }
        if (canShowNotFound && error instanceof ApiError && error.isNotFound) {
          setResult({ key, status: "not-found" });
          return;
        }
        setResult({ key, status: "error", error });
        notifyRequestFailed(subject, error);
      }
    })();
    return () => controller.abort();
  }, [key, attempt, hasRequest, canShowNotFound, subject]);

  // A result that belongs to an older key is stale: show loading instead.
  const current = result?.key === key ? result : undefined;
  const isReadyEmpty =
    renderEmpty !== undefined && current?.status === "ready" && Boolean(isEmpty?.(current.data));
  let state: AsyncContentState = "loading";
  if (current) {
    state = isReadyEmpty ? "empty" : current.status;
  }

  const notifyState = useEffectEvent((next: AsyncContentState) => onStateChange?.(next));
  useEffect(() => notifyState(state), [state]);

  function renderBody(): ReactNode {
    if (!current) {
      return renderLoading();
    }
    if (current.status === "error") {
      return (
        <ErrorBanner
          message={describeRequestError(current.error)}
          onRetry={() => setAttempt((count) => count + 1)}
        />
      );
    }
    if (current.status === "not-found") {
      return renderNotFound?.();
    }
    return isReadyEmpty ? renderEmpty?.() : renderData(current.data);
  }

  return (
    <div className={className} aria-busy={state === "loading" ? true : undefined}>
      {renderBody()}
    </div>
  );
}
