import { useLocation, useNavigate } from "react-router";
import { MaterialIcon } from "../../components/icons/MaterialIcon";
import "./not-found-page.scss";

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
  const navigate = useNavigate();
  return (
    <main className="not-found-page">
      <div className="not-found-page__inner">
        <p className="not-found-page__code" aria-hidden="true">
          404
        </p>
        <h1 className="not-found-page__title">Page not found</h1>
        <p className="not-found-page__message">
          The page <code className="not-found-page__path">{readablePath(pathname)}</code>{" "}
          doesn&apos;t exist or has been moved.
        </p>
        <button
          type="button"
          className="btn btn--filled btn--large"
          onClick={() => void navigate("/")}
        >
          <MaterialIcon name="home" />
          Return to Home Page
        </button>
      </div>
    </main>
  );
}
