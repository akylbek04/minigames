import { useEffect, useState } from "react";
import { loadProfile, onProfileChange, type ProfileData } from "../profile/profile-store";

// The signed-in user's profile, kept fresh as activity is tracked here or in
// another tab (see watchOtherTabs). Undefined email means a guest.
export function useProfile(email: string | undefined): ProfileData | undefined {
  const [latest, setLatest] = useState<{ email: string; data: ProfileData }>();

  useEffect(() => {
    return email
      ? onProfileChange((changed, data) => {
          if (changed.toLowerCase() === email.toLowerCase()) {
            setLatest({ email, data });
          }
        })
      : undefined;
  }, [email]);

  if (!email) {
    return undefined;
  }
  // A pushed update only counts for the user it was made for.
  return latest?.email === email ? latest.data : loadProfile(email);
}
