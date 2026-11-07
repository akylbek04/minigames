import { ApiError } from "../../api/client";
import { showSnackbar } from "../snackbar/snackbar";

export { describeRequestError } from "./request-notices";

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

export interface MutationMessages {
  // The server refused the change; nothing was saved.
  failed: string;
  // No (clear) answer: the change may have been saved.
  unknown: string;
}

// Snackbar for a failed change request (favorite, comment, like). None of
// them is retried automatically: a resent toggle could undo the first one.
export function notifyMutationFailed(error: unknown, messages: MutationMessages): void {
  if (error instanceof ApiError && error.isRateLimited) {
    showSnackbar(`Too many requests. ${error.message}`, "warning");
  } else if (error instanceof ApiError && error.isOutcomeUnknown) {
    showSnackbar(messages.unknown, "warning");
  } else {
    showSnackbar(messages.failed, "error");
  }
}
