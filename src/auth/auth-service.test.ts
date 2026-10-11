import { beforeEach, describe, expect, it, vi } from "vitest";
import { FirebaseError } from "firebase/app";
import * as firebaseAuth from "firebase/auth";
import {
  describeAuthError,
  isAuthCancelled,
  registerWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOutFromFirebase,
} from "./auth-service";

vi.mock("./firebase", () => ({ firebaseAuth: { name: "test-auth" } }));
vi.mock("firebase/auth", () => ({
  GoogleAuthProvider: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
}));

function credential(user: Partial<firebaseAuth.User>): firebaseAuth.UserCredential {
  return { user } as firebaseAuth.UserCredential;
}

describe("auth service", () => {
  beforeEach(() => {
    vi.mocked(firebaseAuth.updateProfile).mockResolvedValue();
  });

  it("signs in with email and keeps only profile fields", async () => {
    vi.mocked(firebaseAuth.signInWithEmailAndPassword).mockResolvedValue(
      credential({ displayName: "Alex", email: "alex@rs.school", photoURL: null }),
    );

    await expect(signInWithEmail("alex@rs.school", "secret1")).resolves.toEqual({
      displayName: "Alex",
      email: "alex@rs.school",
    });
    expect(firebaseAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(
      { name: "test-auth" },
      "alex@rs.school",
      "secret1",
    );
  });

  it("registers and saves the username as the Firebase displayName", async () => {
    const user = { displayName: null, email: "new@rs.school", photoURL: null };
    vi.mocked(firebaseAuth.createUserWithEmailAndPassword).mockResolvedValue(credential(user));

    const profile = await registerWithEmail("Newbie", "new@rs.school", "Secret1!");

    expect(firebaseAuth.updateProfile).toHaveBeenCalledWith(user, { displayName: "Newbie" });
    expect(profile).toEqual({ displayName: "Newbie", email: "new@rs.school" });
  });

  it("signs in with Google and keeps the photo as avatarUrl", async () => {
    vi.mocked(firebaseAuth.signInWithPopup).mockResolvedValue(
      credential({ displayName: "G User", email: "g@gmail.com", photoURL: "https://img/1" }),
    );

    await expect(signInWithGoogle()).resolves.toEqual({
      displayName: "G User",
      email: "g@gmail.com",
      avatarUrl: "https://img/1",
    });
    expect(firebaseAuth.GoogleAuthProvider).toHaveBeenCalledOnce();
  });

  it("signs out of Firebase", async () => {
    vi.mocked(firebaseAuth.signOut).mockResolvedValue();
    await signOutFromFirebase();
    expect(firebaseAuth.signOut).toHaveBeenCalledWith({ name: "test-auth" });
  });

  it("maps Firebase error codes to readable messages", () => {
    expect(describeAuthError(new FirebaseError("auth/invalid-credential", ""))).toBe(
      "Incorrect email or password.",
    );
    expect(describeAuthError(new FirebaseError("auth/email-already-in-use", ""))).toMatch(
      /already exists/,
    );
    expect(describeAuthError(new Error("boom"))).toBe("Sign-in failed. Please try again.");
  });

  it("recognizes a Google window closed by the user as a cancel", () => {
    expect(isAuthCancelled(new FirebaseError("auth/popup-closed-by-user", ""))).toBe(true);
    expect(isAuthCancelled(new FirebaseError("auth/popup-blocked", ""))).toBe(false);
  });
});
