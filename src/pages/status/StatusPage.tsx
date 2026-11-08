import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { MaterialIcon } from "../../components/icons/MaterialIcon";
import "./status-page.scss";

// The layout shared by the pages that say "you can't be here": a big code, a
// title, a message and a way back Home.
export function StatusPage({
  code,
  title,
  children,
}: {
  code: string;
  title: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <main className="status-page">
      <div className="status-page__inner">
        <p className="status-page__code" aria-hidden="true">
          {code}
        </p>
        <h1 className="status-page__title">{title}</h1>
        <p className="status-page__message">{children}</p>
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
