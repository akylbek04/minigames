import type { ButtonHTMLAttributes, ReactNode } from "react";
import { MaterialIcon } from "../icons/MaterialIcon";

// A control waiting for a request: a spinner comes first and assistive tech
// hears that it is busy. Disabling it is up to the caller.
export function BusyButton({
  isBusy,
  className,
  children,
  ...props
}: {
  isBusy: boolean;
  className: string;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className={`${className}${isBusy ? " is-busy" : ""}`} aria-busy={isBusy}>
      {isBusy && <MaterialIcon name="progress_activity" className="busy-spinner" />}
      {children}
    </button>
  );
}
