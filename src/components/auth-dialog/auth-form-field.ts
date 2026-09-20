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

export function createField({
  id,
  label,
  type,
  placeholder,
  autocomplete,
  iconName,
  hint,
  passwordToggle,
}: FieldOptions): HTMLElement {
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

  const children: (Node | string)[] = [
    el("label", { for: id, class: "auth-dialog__label" }, [label]),
    wrapper,
    ...(hint ? [el("p", { class: "auth-dialog__hint" }, [hint])] : []),
  ];

  return el("div", { class: "auth-dialog__field" }, children);
}
