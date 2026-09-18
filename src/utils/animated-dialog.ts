export function closeDialogAnimated(dialog: HTMLDialogElement): void {
  if (dialog.classList.contains("is-closing")) {
    return;
  }
  dialog.classList.add("is-closing");
  dialog.addEventListener(
    "transitionend",
    () => {
      dialog.classList.remove("is-closing");
      dialog.close();
    },
    { once: true },
  );
}
