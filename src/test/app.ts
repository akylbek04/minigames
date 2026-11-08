export const SESSION_KEY = "minigames:akylbek04-minigames:app-session";
export const PROFILE = { displayName: "Alex Doe", email: "alex@rs.school" };

export function storeSession(authenticatedAt = Date.now()): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ ...PROFILE, authenticatedAt }));
}
