// GitHub Pages serves this project from a subpath (/minigames/, see vite.config.ts's
// base), so any root-relative path built as a plain runtime string - as opposed to a
// bundler-resolved import, which Vite already rewrites correctly - needs that prefix too.
export function assetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
}
