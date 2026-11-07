import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import { closeDialogAnimated, openDialogAnimated } from "../../utils/animated-dialog";

interface AnimatedDialogProps {
  isOpen: boolean;
  // Esc or a click on the backdrop. The owner decides what closing means
  // (usually a URL change), then flips `isOpen`.
  onRequestClose: () => void;
  className: string;
  id?: string;
  labelledBy?: string;
  // Accessible name when there is no visible heading to point at.
  label?: string;
  // False locks the dialog open (also against Esc, natively) while a
  // request is pending.
  isDismissible?: boolean;
  // Every click inside the dialog, for owners that react to what was hit.
  onClick?: (event: MouseEvent<HTMLDialogElement>) => void;
  children: ReactNode;
}

// A native modal <dialog> driven by `isOpen`, with the shared enter/exit
// transitions.
export function AnimatedDialog({
  isOpen,
  onRequestClose,
  className,
  id,
  labelledBy,
  label,
  isDismissible = true,
  onClick,
  children,
}: AnimatedDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) {
      return;
    }
    if (isOpen) {
      openDialogAnimated(dialog);
    } else {
      closeDialogAnimated(dialog);
    }
  }, [isOpen]);

  return (
    <dialog
      ref={ref}
      id={id}
      className={className}
      aria-labelledby={labelledBy}
      aria-label={label}
      {...(!isDismissible && { closedby: "none" })}
      onCancel={(event) => {
        event.preventDefault();
        onRequestClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onRequestClose();
        }
        onClick?.(event);
      }}
    >
      {children}
    </dialog>
  );
}
