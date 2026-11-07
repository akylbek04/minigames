import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router";
import { routes } from "./app/routes";
import { SessionProvider } from "./hooks/use-session";
import { watchOtherTabs } from "./profile/profile-store";
import "./styles/globals.scss";

// Served from a subpath on GitHub Pages (see vite.config.ts's base).
const router = createBrowserRouter(routes, {
  basename: import.meta.env.BASE_URL.replace(/\/$/, ""),
});

// A profile changed in another tab refreshes this one.
watchOtherTabs();

createRoot(document.querySelector("#root")!).render(
  <StrictMode>
    <SessionProvider>
      <RouterProvider router={router} />
    </SessionProvider>
  </StrictMode>,
);
