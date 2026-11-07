import { useEffect, useState, type ReactNode } from "react";
import {
  registerWithEmail,
  signInWithEmail,
  signInWithGoogle,
  type AuthProfile,
} from "../../auth/auth-service";
import {
  validateConfirmPassword,
  validateEmail,
  validateLoginPassword,
  validateRegisterPassword,
  validateUsername,
} from "../../auth/validation";
import { useFormField } from "../../hooks/use-form-field";
import type { AuthMode } from "../../types/auth";
import { icons } from "../icons/icons";
import { InlineIcon } from "../icons/InlineIcon";
import { MaterialIcon } from "../icons/MaterialIcon";
import { AuthField } from "./AuthField";

export type AuthControl = "submit" | "google";

export interface PanelProps {
  // True while a sign-in runs: every control of the panel is locked.
  isPending: boolean;
  // The control that started the running request, which shows the spinner.
  busyControl: AuthControl | undefined;
  onSwitch: (mode: AuthMode) => void;
  onAuthRequest: (request: () => Promise<AuthProfile>, control: AuthControl) => void;
}

function BusyButton({
  isBusy,
  className,
  children,
  ...props
}: {
  isBusy: boolean;
  className: string;
  children: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className={`${className}${isBusy ? " is-busy" : ""}`} aria-busy={isBusy}>
      {isBusy && <MaterialIcon name="progress_activity" className="busy-spinner" />}
      {children}
    </button>
  );
}

// Fades in on mount; a fresh panel each time (see AuthDialog's key), so
// switching clears the fields and errors. A fieldset, so disabling it locks
// every input and button at once while a request is pending.
function Panel({ isPending, children }: { isPending: boolean; children: ReactNode }) {
  const [isEntering, setEntering] = useState(true);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntering(false));
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <fieldset
      className={`auth-dialog__panel${isEntering ? " is-entering" : ""}`}
      disabled={isPending}
    >
      {children}
    </fieldset>
  );
}

// Google covers both sign-in and sign-up: a new account is created on the
// first sign-in.
function GoogleSection({
  label,
  busyControl,
  onAuthRequest,
}: Pick<PanelProps, "busyControl" | "onAuthRequest"> & { label: string }) {
  return (
    <>
      <div className="auth-dialog__divider">
        <span>OR</span>
      </div>
      <BusyButton
        type="button"
        className="btn btn--outline btn--large auth-dialog__google"
        isBusy={busyControl === "google"}
        onClick={() => onAuthRequest(signInWithGoogle, "google")}
      >
        <InlineIcon markup={icons.google} />
        {label}
      </BusyButton>
    </>
  );
}

export function LoginPanel({ isPending, busyControl, onSwitch, onAuthRequest }: PanelProps) {
  const email = useFormField(validateEmail);
  const password = useFormField(validateLoginPassword);
  const isValid = email.isValid && password.isValid;

  function submit(event: React.FormEvent): void {
    event.preventDefault();
    if (!isValid) {
      email.touch();
      password.touch();
      return;
    }
    const address = email.value.trim();
    onAuthRequest(() => signInWithEmail(address, password.value), "submit");
  }

  return (
    <Panel isPending={isPending}>
      <h2 className="auth-dialog__title">Welcome Back!</h2>
      <p className="auth-dialog__subtitle">Sign in to resume your games and progress.</p>
      <form className="auth-dialog__form" noValidate onSubmit={submit}>
        <AuthField
          id="login-email"
          label="Email Address"
          type="email"
          placeholder="e.g. alex@minigames.com"
          autoComplete="email"
          iconName="mail"
          value={email.value}
          error={email.error}
          onChange={email.setValue}
          onTouch={email.touch}
        />
        <AuthField
          id="login-password"
          label="Password"
          type="password"
          placeholder="Enter your password"
          autoComplete="current-password"
          iconName="lock"
          hasPasswordToggle
          value={password.value}
          error={password.error}
          onChange={password.setValue}
          onTouch={password.touch}
        />
        <button type="button" className="auth-dialog__forgot">
          Forgot Password?
        </button>
        <BusyButton
          type="submit"
          className="btn btn--filled btn--large auth-dialog__submit"
          isBusy={busyControl === "submit"}
          disabled={!isValid}
        >
          Login
        </BusyButton>
      </form>
      <GoogleSection
        label="Continue with Google"
        busyControl={busyControl}
        onAuthRequest={onAuthRequest}
      />
      <p className="auth-dialog__switch-text">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          className="auth-dialog__link-inline"
          onClick={() => onSwitch("register")}
        >
          Register
        </button>
      </p>
    </Panel>
  );
}

export function RegisterPanel({ isPending, busyControl, onSwitch, onAuthRequest }: PanelProps) {
  const username = useFormField(validateUsername);
  const email = useFormField(validateEmail);
  const password = useFormField(validateRegisterPassword);
  const confirmation = useFormField((value) => validateConfirmPassword(value, password.value));
  const fields = [username, email, password, confirmation];
  const isValid = fields.every((field) => field.isValid);

  function submit(event: React.FormEvent): void {
    event.preventDefault();
    if (!isValid) {
      for (const field of fields) {
        field.touch();
      }
      return;
    }
    const address = email.value.trim();
    onAuthRequest(() => registerWithEmail(username.value, address, password.value), "submit");
  }

  return (
    <Panel isPending={isPending}>
      <h2 className="auth-dialog__title">Create Account</h2>
      <p className="auth-dialog__subtitle">Join MiniGames to track your score &amp; streak.</p>
      <form className="auth-dialog__form" noValidate onSubmit={submit}>
        <AuthField
          id="register-username"
          label="Username"
          type="text"
          placeholder="e.g. CozyGamer_99"
          autoComplete="username"
          iconName="person"
          value={username.value}
          error={username.error}
          onChange={username.setValue}
          onTouch={username.touch}
        />
        <AuthField
          id="register-email"
          label="Email Address"
          type="email"
          placeholder="your.email@domain.com"
          autoComplete="email"
          iconName="mail"
          value={email.value}
          error={email.error}
          onChange={email.setValue}
          onTouch={email.touch}
        />
        <AuthField
          id="register-password"
          label="Password"
          type="password"
          placeholder="Min. 6 characters"
          autoComplete="new-password"
          iconName="lock"
          value={password.value}
          error={password.error}
          onChange={password.setValue}
          onTouch={password.touch}
        />
        <AuthField
          id="register-confirm-password"
          label="Confirm Password"
          type="password"
          placeholder="Repeat your password"
          autoComplete="new-password"
          iconName="lock"
          value={confirmation.value}
          error={confirmation.error}
          onChange={confirmation.setValue}
          onTouch={confirmation.touch}
        />
        <BusyButton
          type="submit"
          className="btn btn--filled btn--large auth-dialog__submit"
          isBusy={busyControl === "submit"}
          disabled={!isValid}
        >
          Create Account
        </BusyButton>
      </form>
      <GoogleSection
        label="Sign up with Google"
        busyControl={busyControl}
        onAuthRequest={onAuthRequest}
      />
      <p className="auth-dialog__switch-text">
        Already have an account?{" "}
        <button
          type="button"
          className="auth-dialog__link-inline"
          onClick={() => onSwitch("login")}
        >
          Login
        </button>
      </p>
    </Panel>
  );
}
