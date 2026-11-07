import { useState } from "react";

// A text field with real-time validation: the error shows once the field has
// been typed in or left, and is re-checked on every render (so a confirmation
// follows edits of the password it depends on).
export function useFormField(validate: (value: string) => string | undefined) {
  const [value, setValue] = useState("");
  const [isTouched, setTouched] = useState(false);
  const problem = validate(value);
  return {
    value,
    setValue,
    touch: () => setTouched(true),
    isValid: problem === undefined,
    error: isTouched ? problem : undefined,
  };
}
