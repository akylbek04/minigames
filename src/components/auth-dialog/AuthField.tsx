import { useState } from "react";
import { MaterialIcon } from "../icons/MaterialIcon";

interface AuthFieldProps {
  id: string;
  label: string;
  type: "text" | "email" | "password";
  placeholder: string;
  autoComplete: string;
  iconName: string;
  value: string;
  // Shown under the input once the user has typed in it or left it.
  error: string | undefined;
  hasPasswordToggle?: boolean;
  onChange: (value: string) => void;
  onTouch: () => void;
}

export function AuthField({
  id,
  label,
  type,
  placeholder,
  autoComplete,
  iconName,
  value,
  error,
  hasPasswordToggle = false,
  onChange,
  onTouch,
}: AuthFieldProps) {
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
            onChange(event.target.value);
            onTouch();
          }}
          onBlur={onTouch}
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
