export function closeDialogAnimated(dialog: HTMLDialogElement): void {
  if (!dialog.open || dialog.classList.contains("is-closing")) {
    return;
  }
  dialog.classList.add("is-closing");
  // Close while still "is-closing" so the exit opacity/transform hold in place
  // while the discrete display/overlay transition plays out; removing the
  // class first would snap opacity back to 1 and flash the dialog visible again.
  // allSettled: a transition cancelled by a quick reopen rejects `finished`.
  void Promise.allSettled(dialog.getAnimations().map((animation) => animation.finished)).then(
    () => {
      // Back/Forward can reopen the dialog mid-exit; only close if it is
      // still on its way out.
      if (dialog.classList.contains("is-closing")) {
        dialog.close();
      }
    },
  );
}

export function openDialogAnimated(dialog: HTMLDialogElement): void {
  dialog.classList.remove("is-closing");
  if (!dialog.open) {
    dialog.showModal();
  }
}
