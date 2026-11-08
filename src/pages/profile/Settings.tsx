import { useEffect, useRef, useState } from "react";
import { showSnackbar } from "../../hooks/snackbar-store";
import { resetProfile } from "../../profile/profile-store";

// How long "Reset all progress" waits for its confirming second click.
const RESET_CONFIRM_DELAY = 4000;

// Reset needs a second click: it erases counts and badges for good.
export function Settings({ email }: { email: string }) {
  const [isArmed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  function reset(): void {
    if (!isArmed) {
      setArmed(true);
      timer.current = setTimeout(() => setArmed(false), RESET_CONFIRM_DELAY);
      return;
    }
    clearTimeout(timer.current);
    setArmed(false);
    resetProfile(email);
    showSnackbar("Your progress was reset.", "success");
  }

  return (
    <div className="profile-page__actions">
      <button type="button" className="btn btn--outline" onClick={reset}>
        {isArmed ? "Click again to erase everything" : "Reset all progress"}
      </button>
    </div>
  );
}
