import { useLocation } from "react-router";
import { StatusPage } from "../status/StatusPage";

// A malformed escape such as "/%E0%A4%A" makes decodeURI throw, and an
// invalid deep link must still render this page.
function readablePath(pathname: string): string {
  try {
    return decodeURI(pathname);
  } catch {
    return pathname;
  }
}

// Shown for any path the router doesn't know; the header and footer stay.
export function NotFoundPage() {
  const { pathname } = useLocation();
  return (
    <StatusPage code="404" title="Page not found">
      The page <code className="status-page__path">{readablePath(pathname)}</code> doesn&apos;t
      exist or has been moved.
    </StatusPage>
  );
}
