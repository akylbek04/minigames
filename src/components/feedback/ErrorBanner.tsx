import { MaterialIcon } from "../icons/MaterialIcon";
import "./error-banner.scss";

interface ErrorBannerProps {
  title?: string;
  message: string;
  onRetry: () => void;
}

// Replaces a content area whose request failed on the network or server;
// the retry button re-dispatches that same request.
export function ErrorBanner({
  title = "Something went wrong",
  message,
  onRetry,
}: ErrorBannerProps) {
  return (
    <div className="error-banner" role="alert">
      <MaterialIcon name="cloud_off" className="error-banner__icon" />
      <div className="error-banner__text">
        <p className="error-banner__title">{title}</p>
        <p className="error-banner__message">{message}</p>
      </div>
      <button type="button" className="btn btn--filled error-banner__retry" onClick={onRetry}>
        <MaterialIcon name="refresh" />
        Try again
      </button>
    </div>
  );
}
