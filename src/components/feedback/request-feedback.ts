import { ApiError } from "../../api/client";
import { showSnackbar } from "../snackbar/snackbar";

// Text for the error banner of a content area that failed to load.
export function describeRequestError(error: unknown): string {
  if (error instanceof ApiError && error.isRateLimited) {
    return error.message;
  }
  return error instanceof ApiError && error.status === 0
    ? "We couldn't reach the server. Check your connection and try again."
    : "The server didn't respond as expected. Please try again in a moment.";
}

// Snackbar counterpart of the banner: a rate limit is a warning (waiting
// fixes it), anything else is an error.
export function notifyRequestFailed(subject: string, error: unknown): void {
  if (error instanceof ApiError && error.isRateLimited) {
    showSnackbar(`Too many requests while loading ${subject}. ${error.message}`, "warning");
    return;
  }
  showSnackbar(`Couldn't load ${subject}.`, "error");
}

export function notifyRequestRecovered(subject: string): void {
  showSnackbar(`${subject} loaded successfully.`, "success");
}
