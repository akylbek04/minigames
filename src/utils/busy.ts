import { materialIcon } from "./icon";

const SPINNER_CLASS = "busy-spinner";

// Marks a control as waiting for a request: a spinner replaces its icon and
// assistive tech hears that it is busy. Disabling it is up to the caller.
export function setBusy(control: HTMLElement, isBusy: boolean): void {
  control.setAttribute("aria-busy", String(isBusy));
  control.classList.toggle("is-busy", isBusy);
  control.querySelector(`.${SPINNER_CLASS}`)?.remove();
  if (isBusy) {
    control.prepend(materialIcon("progress_activity", SPINNER_CLASS));
  }
}
