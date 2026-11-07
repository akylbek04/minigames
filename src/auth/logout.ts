import { showSnackbar } from "../hooks/snackbar-store";
import { endSession } from "./session";

// The app is a guest again even if Firebase couldn't sign out; its own
// persisted user is never used to restore a session.
export async function logout(): Promise<void> {
  try {
    await endSession("logout");
  } catch {
    showSnackbar("Couldn't sign out of Firebase. You're browsing as a guest.", "error");
  }
}
