export function closeDialogAnimated(dialog: HTMLDialogElement): void {
  if (!dialog.open || dialog.classList.contains("is-closing")) {
    return;
  }
  dialog.classList.add("is-closing");
  // Close while still "is-closing" so the exit opacity/transform hold in place
  // while the discrete display/overlay transition plays out; removing the
  // class first would snap opacity back to 1 and flash the dialog visible again.
  dialog.addEventListener("transitionend", () => dialog.close(), { once: true });
}

export function openDialogAnimated(dialog: HTMLDialogElement): void {
  dialog.classList.remove("is-closing");
  dialog.showModal();
}
