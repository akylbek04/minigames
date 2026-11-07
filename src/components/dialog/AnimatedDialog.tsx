import { useEffect, useRef, type ReactNode } from "react";
import { closeDialogAnimated, openDialogAnimated } from "../../utils/animated-dialog";

interface AnimatedDialogProps {
  isOpen: boolean;
  // Esc or a click on the backdrop. The owner decides what closing means
  // (usually a URL change), then flips `isOpen`.
  onRequestClose: () => void;
  className: string;
  labelledBy?: string;
  children: ReactNode;
}

// A native modal <dialog> driven by `isOpen`, with the shared enter/exit
// transitions.
export function AnimatedDialog({
  isOpen,
  onRequestClose,
  className,
  labelledBy,
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
      className={className}
      aria-labelledby={labelledBy}
      onCancel={(event) => {
        event.preventDefault();
        onRequestClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onRequestClose();
        }
      }}
    >
      {children}
    </dialog>
  );
}
