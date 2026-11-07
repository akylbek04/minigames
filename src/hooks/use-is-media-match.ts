import { useSyncExternalStore } from "react";

export function useIsMediaMatch(condition: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = matchMedia(condition);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => matchMedia(condition).matches,
  );
}
