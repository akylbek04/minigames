// Brand marks come from our own .svg files (imported as raw markup), so
// they can follow the text color through currentColor.
export function InlineIcon({ markup, className = "icon" }: { markup: string; className?: string }) {
  return (
    <span className={className} aria-hidden="true" dangerouslySetInnerHTML={{ __html: markup }} />
  );
}
