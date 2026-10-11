import { FirebaseError } from "firebase/app";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { firebaseAuth } from "./firebase";

// What the app keeps from a Firebase user: no tokens, no provider data.
export interface AuthProfile {
  displayName: string;
  email: string;
  avatarUrl?: string;
}

function toProfile(user: User, displayName = user.displayName ?? ""): AuthProfile {
  return {
    displayName,
    email: user.email ?? "",
    ...(user.photoURL && { avatarUrl: user.photoURL }),
  };
}

export async function signInWithEmail(email: string, password: string): Promise<AuthProfile> {
  const { user } = await signInWithEmailAndPassword(firebaseAuth, email, password);
  return toProfile(user);
}

export async function registerWithEmail(
  username: string,
  email: string,
  password: string,
): Promise<AuthProfile> {
  const { user } = await createUserWithEmailAndPassword(firebaseAuth, email, password);
  await updateProfile(user, { displayName: username });
  return toProfile(user, username);
}

export async function signInWithGoogle(): Promise<AuthProfile> {
  const { user } = await signInWithPopup(firebaseAuth, new GoogleAuthProvider());
  return toProfile(user);
}

export function signOutFromFirebase(): Promise<void> {
  return signOut(firebaseAuth);
}

function getErrorCode(error: unknown): string {
  return error instanceof FirebaseError ? error.code : "";
}

// The user closed the Google window themselves: nothing went wrong.
const CANCELLED_CODES = new Set(["auth/popup-closed-by-user", "auth/cancelled-popup-request"]);

export function isAuthCancelled(error: unknown): boolean {
  return CANCELLED_CODES.has(getErrorCode(error));
}

const WRONG_CREDENTIALS = "Incorrect email or password.";

const ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-credential": WRONG_CREDENTIALS,
  "auth/wrong-password": WRONG_CREDENTIALS,
  "auth/user-not-found": WRONG_CREDENTIALS,
  "auth/invalid-email": "This email address is not valid.",
  "auth/email-already-in-use": "An account with this email already exists. Try logging in.",
  "auth/weak-password": "This password is too weak. Choose a stronger one.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
  "auth/network-request-failed": "We couldn't reach the server. Check your connection.",
  "auth/popup-blocked": "The browser blocked the Google window. Allow pop-ups and try again.",
  "auth/account-exists-with-different-credential":
    "This email is already registered with another sign-in method.",
};

export function describeAuthError(error: unknown): string {
  return ERROR_MESSAGES[getErrorCode(error)] ?? "Sign-in failed. Please try again.";
}
