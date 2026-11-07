import type { ReactNode } from "react";
import "./skeleton.scss";

// One shimmering placeholder block; its size comes from the caller's class.
export function Skeleton({ className = "" }: { className?: string }) {
  return <span className={`skeleton ${className}`.trim()} aria-hidden="true" />;
}

// Wraps a section's placeholders so assistive tech hears one "Loading…"
// message instead of a pile of empty blocks.
export function SkeletonGroup({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`skeleton-group ${className}`.trim()} role="status">
      <span className="visually-hidden">{label}</span>
      {children}
    </div>
  );
}
