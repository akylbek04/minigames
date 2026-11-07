import { render } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router";
import { routes } from "../app/routes";
import { SessionProvider } from "../hooks/use-session";

// Mounts the real app on `url` like a page load: the session is read from
// storage, then the routes render. Firebase must be mocked by the test file.
export function renderApp(url = "/") {
  const router = createMemoryRouter(routes, { initialEntries: [url] });
  const view = render(
    <SessionProvider>
      <RouterProvider router={router} />
    </SessionProvider>,
  );
  return { router, ...view };
}
