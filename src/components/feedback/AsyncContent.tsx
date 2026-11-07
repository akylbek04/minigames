import { useEffect, useEffectEvent, type ReactNode } from "react";
import { useAsyncResult, type AsyncResult } from "../../hooks/use-async-result";
import { ErrorBanner } from "./ErrorBanner";
import { describeRequestError } from "./request-notices";

export type AsyncContentState = "loading" | "ready" | "empty" | "not-found" | "error";

interface AsyncViewProps<T> {
  result: AsyncResult<T>;
  renderLoading: () => ReactNode;
  renderData: (data: T) => ReactNode;
  isEmpty?: (data: T) => boolean;
  renderEmpty?: () => ReactNode;
  renderNotFound?: () => ReactNode;
  onStateChange?: (state: AsyncContentState) => void;
  className?: string;
}

// One content area that cycles through the shared feedback states: skeleton
// while pending, then the data, an empty/not-found placeholder, or an error
// banner whose retry re-sends the same request.
export function AsyncView<T>({
  result,
  renderLoading,
  renderData,
  isEmpty,
  renderEmpty,
  renderNotFound,
  onStateChange,
  className,
}: AsyncViewProps<T>) {
  const isReadyEmpty =
    renderEmpty !== undefined && result.status === "ready" && Boolean(isEmpty?.(result.data));
  const state: AsyncContentState = isReadyEmpty ? "empty" : result.status;

  const notifyState = useEffectEvent((next: AsyncContentState) => onStateChange?.(next));
  useEffect(() => notifyState(state), [state]);

  function renderBody(): ReactNode {
    switch (result.status) {
      case "loading": {
        return renderLoading();
      }
      case "error": {
        return <ErrorBanner message={describeRequestError(result.error)} onRetry={result.retry} />;
      }
      case "not-found": {
        return renderNotFound?.();
      }
      case "ready": {
        return isReadyEmpty ? renderEmpty() : renderData(result.data);
      }
    }
  }

  return (
    <div className={className} aria-busy={result.status === "loading" ? true : undefined}>
      {renderBody()}
    </div>
  );
}

interface AsyncContentProps<T> extends Omit<AsyncViewProps<T>, "result"> {
  subject: string;
  requestKey: string;
  request?: (signal: AbortSignal) => Promise<T>;
}

// AsyncView plus the request that feeds it.
export function AsyncContent<T>({
  subject,
  requestKey,
  request,
  renderNotFound,
  ...view
}: AsyncContentProps<T>) {
  const result = useAsyncResult({
    subject,
    requestKey,
    request,
    canShowNotFound: renderNotFound !== undefined,
  });
  return <AsyncView result={result} renderNotFound={renderNotFound} {...view} />;
}
