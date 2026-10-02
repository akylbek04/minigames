export interface AppPage {
  element: HTMLElement;
  // Called whenever the URL changes while this page is the active route,
  // so the page can restore its state (and data) from the query.
  show?: (query: URLSearchParams) => void;
}
