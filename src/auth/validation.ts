// Each validator returns the message to show, or undefined when valid.
export type Validator = (value: string) => string | undefined;

const EMAIL_PATTERN = /^[\w%+.-]+@[\dA-Za-z-]+(?:\.[\dA-Za-z-]+)*\.[A-Za-z]{2,}$/;
const USERNAME_MIN = 2;
const USERNAME_MAX = 30;
const PASSWORD_MIN = 6;
// English letters, digits and printable ASCII specials; no spaces.
const PASSWORD_ALLOWED = /^[!-~]*$/;

export const validateEmail: Validator = (value) => {
  if (value.trim() === "") {
    return "Email is required.";
  }
  return EMAIL_PATTERN.test(value.trim())
    ? undefined
    : "Enter a valid email, e.g. name@example.com.";
};

export const validateUsername: Validator = (value) => {
  if (value === "") {
    return "Username is required.";
  }
  if (value.length < USERNAME_MIN || value.length > USERNAME_MAX) {
    return `Username must be ${USERNAME_MIN}–${USERNAME_MAX} characters long.`;
  }
  if (!/^[A-Z]/.test(value)) {
    return "Username must start with an uppercase English letter.";
  }
  return /^[\dA-Za-z]+$/.test(value) ? undefined : "Use English letters and digits only.";
};

function validatePasswordLength(value: string): string | undefined {
  if (value === "") {
    return "Password is required.";
  }
  return value.length < PASSWORD_MIN
    ? `Password must be at least ${PASSWORD_MIN} characters long.`
    : undefined;
}

// Login only checks presence and length; strength is a registration rule.
export const validateLoginPassword: Validator = validatePasswordLength;

export const validateRegisterPassword: Validator = (value) => {
  const lengthError = validatePasswordLength(value);
  if (lengthError) {
    return lengthError;
  }
  if (!PASSWORD_ALLOWED.test(value)) {
    return "Use English letters, digits and special characters only.";
  }
  if (!/[A-Z]/.test(value)) {
    return "Add at least one uppercase English letter.";
  }
  if (!/\d/.test(value)) {
    return "Add at least one digit.";
  }
  return /[^\dA-Za-z]/.test(value) ? undefined : "Add at least one special character, e.g. !@#$.";
};

// Only the match is checked; the password field already enforces the rules.
export function validateConfirmPassword(value: string, password: string): string | undefined {
  if (value === "") {
    return "Please confirm your password.";
  }
  return value === password ? undefined : "Passwords do not match.";
}
