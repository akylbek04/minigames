export type AuthMode = "login" | "register";

// Anything else in `?auth=` is ignored and the dialog stays closed.
export function parseAuthMode(value: string | null): AuthMode | undefined {
  return value === "login" || value === "register" ? value : undefined;
}
