import { StatusPage } from "./StatusPage";

// The route `errorElement`: a page that throws while rendering shows this
// instead of a blank screen. The layout (header, footer) stays around it, and
// the error text is never shown.
export function ErrorPage() {
  return (
    <StatusPage code="Oops" title="Something went wrong">
      This page failed to load. Go back Home and try again.
    </StatusPage>
  );
}
