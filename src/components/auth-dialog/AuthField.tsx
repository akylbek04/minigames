import { useState } from "react";
import type { FormField } from "../../hooks/use-form-field";
import { MaterialIcon } from "../icons/MaterialIcon";

interface AuthFieldProps {
  id: string;
  label: string;
  type: "text" | "email" | "password";
  placeholder: string;
  autoComplete: string;
  iconName: string;
  // Its error shows under the input once the user has typed in it or left it.
  field: FormField;
  hasPasswordToggle?: boolean;
}

export function AuthField({
  id,
  label,
  type,
  placeholder,
  autoComplete,
  iconName,
  field,
  hasPasswordToggle = false,
}: AuthFieldProps) {
  const { value, error, setValue, touch } = field;
  const [isPasswordShown, setPasswordShown] = useState(false);
  const errorId = `${id}-error`;

  return (
    <div className="auth-dialog__field">
      <label htmlFor={id} className="auth-dialog__label">
        {label}
      </label>
      <div className="auth-dialog__input-wrapper">
        <MaterialIcon name={iconName} className="auth-dialog__input-icon" />
        <input
          id={id}
          name={id}
          type={isPasswordShown ? "text" : type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="auth-dialog__input"
          required
          value={value}
          aria-describedby={errorId}
          aria-invalid={error !== undefined}
          onChange={(event) => {
            setValue(event.target.value);
            touch();
          }}
          onBlur={touch}
        />
        {hasPasswordToggle && (
          <button
            type="button"
            className="auth-dialog__toggle-visibility"
            aria-label={isPasswordShown ? "Hide password" : "Show password"}
            onClick={() => setPasswordShown((isShown) => !isShown)}
          >
            <MaterialIcon name={isPasswordShown ? "visibility_off" : "visibility"} />
          </button>
        )}
      </div>
      <p id={errorId} className="auth-dialog__error" aria-live="polite">
        {error ?? ""}
      </p>
    </div>
  );
}
