import { useLocation, useNavigate } from "react-router";

// Dialog state lives in the URL (`?game=<slug>`, `?auth=login`). Opening
// pushes an entry marked as "opened in-app", so closing can step Back and
// closing and pressing Back lead to the same place. A dialog that came from
// a deep link has no entry of its own, so its parameter is just dropped.
export function useOverlay(key: string) {
  const { pathname, search, state } = useLocation();
  const navigate = useNavigate();
  const value = new URLSearchParams(search).get(key) ?? undefined;

  function withValue(next: string | undefined): string {
    const params = new URLSearchParams(search);
    if (next === undefined) {
      params.delete(key);
    } else {
      params.set(key, next);
    }
    return params.toString();
  }

  return {
    value,
    open: (next: string): void => {
      if (next !== value) {
        void navigate({ pathname, search: withValue(next) }, { state: { overlay: key } });
      }
    },
    // Same dialog, other content (login <-> register): no new entry.
    change: (next: string): void => {
      if (next !== value) {
        void navigate({ pathname, search: withValue(next) }, { replace: true, state });
      }
    },
    close: (): void => {
      const isOpenedInApp =
        typeof state === "object" && state !== null && "overlay" in state && state.overlay === key;
      if (isOpenedInApp) {
        void navigate(-1);
      } else {
        void navigate({ pathname, search: withValue(undefined) }, { replace: true });
      }
    },
  };
}
