import { el } from "../../utils/dom";
import { materialIcon } from "../../utils/icon";

export interface FieldOptions {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  autocomplete: string;
  iconName: string;
  hint?: string;
  passwordToggle?: boolean;
}

export interface AuthField {
  element: HTMLElement;
  input: HTMLInputElement;
  // Shows an inline error under the input, or clears it with undefined.
  setError: (message: string | undefined) => void;
}

export function createField({
  id,
  label,
  type,
  placeholder,
  autocomplete,
  iconName,
  hint,
  passwordToggle,
}: FieldOptions): AuthField {
  const input = el("input", {
    id,
    name: id,
    type,
    placeholder,
    autocomplete,
    class: "auth-dialog__input",
    required: "",
  });

  const wrapper = el("div", { class: "auth-dialog__input-wrapper" }, [
    materialIcon(iconName, "auth-dialog__input-icon"),
    input,
  ]);

  if (passwordToggle) {
    const visibilityIcon = materialIcon("visibility");
    const toggle = el(
      "button",
      { type: "button", class: "auth-dialog__toggle-visibility", "aria-label": "Show password" },
      [visibilityIcon],
    );
    toggle.addEventListener("click", () => {
      const isShowing = input.type === "text";
      input.type = isShowing ? "password" : "text";
      visibilityIcon.textContent = isShowing ? "visibility" : "visibility_off";
      toggle.setAttribute("aria-label", isShowing ? "Show password" : "Hide password");
    });
    wrapper.append(toggle);
  }

  const errorId = `${id}-error`;
  const error = el("p", { id: errorId, class: "auth-dialog__error", "aria-live": "polite" });
  input.setAttribute("aria-describedby", errorId);

  function setError(message: string | undefined): void {
    error.textContent = message ?? "";
    input.setAttribute("aria-invalid", String(message !== undefined));
  }

  const children: (Node | string)[] = [
    el("label", { for: id, class: "auth-dialog__label" }, [label]),
    wrapper,
    ...(hint ? [el("p", { class: "auth-dialog__hint" }, [hint])] : []),
    error,
  ];

  return { element: el("div", { class: "auth-dialog__field" }, children), input, setError };
}
