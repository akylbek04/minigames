import { el } from "../../utils/dom";
import { ApiError, isAbortError } from "../../api/client";
import { createErrorBanner } from "./error-banner";
import {
  describeRequestError,
  notifyRequestFailed,
  notifyRequestRecovered,
} from "./request-feedback";

export type AsyncContentState = "loading" | "ready" | "empty" | "not-found" | "error";

export interface AsyncContentOptions<T> {
  // Names the data in snackbar messages, e.g. "featured games".
  subject: string;
  renderLoading: () => Node;
  renderData: (data: T) => Node;
  isEmpty?: (data: T) => boolean;
  renderEmpty?: () => Node;
  // For 400/404 answers: the requested thing doesn't exist. Without it they
  // are treated like any other failed request.
  renderNotFound?: () => Node;
  onStateChange?: (state: AsyncContentState) => void;
  className?: string;
}

export type Request<T> = (signal: AbortSignal) => Promise<T>;

export interface AsyncContent<T> {
  element: HTMLElement;
  load: (request: Request<T>) => Promise<void>;
  // For when the request can't be sent yet (it waits on other data) but the
  // user should already see that content is on its way.
  showLoading: () => void;
}

// One content area that cycles through the shared feedback states: skeleton
// while pending, then the data, an empty/not-found placeholder, or an error
// banner whose retry re-sends the same request. Starting a new load aborts
// the previous one, so a slow stale response can never overwrite a newer one.
export function createAsyncContent<T>(options: AsyncContentOptions<T>): AsyncContent<T> {
  const element = el("div", { class: options.className ?? "" });
  const state: { controller?: AbortController } = {};

  function show(node: Node, contentState: AsyncContentState): void {
    element.replaceChildren(node);
    options.onStateChange?.(contentState);
  }

  async function load(request: Request<T>, isRetry = false): Promise<void> {
    state.controller?.abort();
    const controller = new AbortController();
    state.controller = controller;

    element.setAttribute("aria-busy", "true");
    show(options.renderLoading(), "loading");

    try {
      const data = await request(controller.signal);
      if (options.isEmpty?.(data) && options.renderEmpty) {
        show(options.renderEmpty(), "empty");
      } else {
        show(options.renderData(data), "ready");
      }
      if (isRetry) {
        notifyRequestRecovered(options.subject);
      }
    } catch (error) {
      if (isAbortError(error) || controller !== state.controller) {
        return;
      }
      if (error instanceof ApiError && error.isNotFound && options.renderNotFound) {
        show(options.renderNotFound(), "not-found");
        return;
      }
      const banner = createErrorBanner({
        message: describeRequestError(error),
        onRetry: () => void load(request, true),
      });
      show(banner, "error");
      notifyRequestFailed(options.subject, error);
    } finally {
      if (controller === state.controller) {
        element.removeAttribute("aria-busy");
      }
    }
  }

  return {
    element,
    load: (request) => load(request),
    showLoading: () => show(options.renderLoading(), "loading"),
  };
}
