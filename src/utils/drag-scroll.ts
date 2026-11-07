const DRAG_THRESHOLD = 5;

// Touch already swipes an overflow container natively; this adds the same
// for a mouse, and swallows the click that ends a drag so it doesn't count
// as a press on whatever it was released over. Returns a function that
// removes it again.
export function enableDragScroll(container: HTMLElement): () => void {
  const controller = new AbortController();
  const { signal } = controller;
  let startX = 0;
  let startScroll = 0;
  let isDragging = false;
  let hasMoved = false;

  container.addEventListener(
    "pointerdown",
    (event) => {
      if (event.pointerType !== "mouse") {
        return;
      }
      isDragging = true;
      hasMoved = false;
      startX = event.clientX;
      startScroll = container.scrollLeft;
    },
    { signal },
  );

  container.addEventListener(
    "pointermove",
    (event) => {
      if (!isDragging) {
        return;
      }
      const delta = event.clientX - startX;
      if (Math.abs(delta) > DRAG_THRESHOLD) {
        hasMoved = true;
      }
      container.scrollLeft = startScroll - delta;
    },
    { signal },
  );

  const stop = (): void => {
    isDragging = false;
  };
  container.addEventListener("pointerup", stop, { signal });
  container.addEventListener("pointerleave", stop, { signal });

  container.addEventListener(
    "click",
    (event) => {
      if (!hasMoved) {
        return;
      }

      event.stopPropagation();
      event.preventDefault();
      hasMoved = false;
    },
    { capture: true, signal },
  );

  return () => controller.abort();
}
