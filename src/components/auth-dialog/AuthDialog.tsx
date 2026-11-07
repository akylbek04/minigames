import { useState } from "react";
import { describeAuthError, isAuthCancelled, type AuthProfile } from "../../auth/auth-service";
import { showSnackbar } from "../../hooks/snackbar-store";
import type { AuthMode } from "../../types/auth";
import { AnimatedDialog } from "../dialog/AnimatedDialog";
import { LoginPanel, RegisterPanel, type AuthControl } from "./AuthPanels";
import "./auth-dialog.scss";

interface AuthDialogProps {
  // From the `auth` URL parameter; undefined closes the dialog.
  mode: AuthMode | undefined;
  // Tab switches and closing go through the URL.
  onModeChange: (mode: AuthMode) => void;
  onRequestClose: () => void;
  // A sign-in succeeded; the app starts its session and closes the dialog.
  onAuthenticated: (profile: AuthProfile) => void;
}

const TABS: { mode: AuthMode; label: string }[] = [
  { mode: "login", label: "Login" },
  { mode: "register", label: "Register" },
];

export function AuthDialog({
  mode,
  onModeChange,
  onRequestClose,
  onAuthenticated,
}: AuthDialogProps) {
  const [busyControl, setBusyControl] = useState<AuthControl>();
  // The panel stays while the dialog plays its closing animation.
  const [shownMode, setShownMode] = useState<AuthMode>("login");
  if (mode !== undefined && mode !== shownMode) {
    setShownMode(mode);
  }
  const isPending = busyControl !== undefined;

  // While a sign-in is pending every control is locked and the dialog can't
  // be dismissed, so no second request can start.
  async function runAuthRequest(
    request: () => Promise<AuthProfile>,
    control: AuthControl,
  ): Promise<void> {
    if (isPending) {
      return;
    }
    setBusyControl(control);
    try {
      const profile = await request();
      setBusyControl(undefined);
      onAuthenticated(profile);
    } catch (error) {
      // The dialog stays open with the entered data, ready for a retry.
      setBusyControl(undefined);
      if (isAuthCancelled(error)) {
        showSnackbar("Google sign-in was cancelled.", "info");
      } else {
        showSnackbar(describeAuthError(error), "error");
      }
    }
  }

  const panelProps = {
    isPending,
    busyControl,
    onSwitch: onModeChange,
    onAuthRequest: (request: () => Promise<AuthProfile>, control: AuthControl) =>
      void runAuthRequest(request, control),
  };

  return (
    <AnimatedDialog
      className="auth-dialog"
      label="Sign in or sign up"
      isOpen={mode !== undefined}
      isDismissible={!isPending}
      onRequestClose={() => {
        if (!isPending) {
          onRequestClose();
        }
      }}
    >
      <div className="auth-dialog__tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.mode}
            type="button"
            role="tab"
            className={`auth-dialog__tab${shownMode === tab.mode ? " is-active" : ""}`}
            aria-selected={shownMode === tab.mode}
            disabled={isPending}
            onClick={() => onModeChange(tab.mode)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="auth-dialog__panels">
        {shownMode === "login" ? (
          <LoginPanel key="login" {...panelProps} />
        ) : (
          <RegisterPanel key="register" {...panelProps} />
        )}
      </div>
    </AnimatedDialog>
  );
}
