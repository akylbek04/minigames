import { Navigate, redirect, type RouteObject } from "react-router";
import { getActiveSession } from "../auth/session";
import { showSnackbar } from "../hooks/snackbar-store";
import { HomePage } from "../pages/home/HomePage";
import { LibraryPage } from "../pages/library/LibraryPage";
import { NotFoundPage } from "../pages/not-found/NotFoundPage";
import { ErrorPage } from "../pages/status/ErrorPage";
import { AppLayout, type RouteHandle } from "./AppLayout";

// Pages only a signed-in user can see (see AppLayout).
const signedInOnly: RouteHandle = { requiresSession: true };

// The Profile page is for signed-in users: guests are told why and sent Home
// with Auth open. Expiry is resolved by getActiveSession first, so an
// expired user counts as a guest here.
function requireProfileAccess() {
  if (getActiveSession()) {
    return { isAllowed: true };
  }
  showSnackbar("Log in to see your profile.", "warning");
  return redirect("/?auth=login");
}

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <AppLayout />,
    HydrateFallback: () => <></>,
    children: [
      {
        // A pathless route: a page that throws keeps the header and footer.
        errorElement: <ErrorPage />,
        children: [
          { index: true, element: <HomePage /> },
          { path: "home", element: <Navigate to="/" replace /> },
          { path: "index.html", element: <Navigate to="/" replace /> },
          { path: "library", element: <LibraryPage /> },
          {
            path: "profile",
            // Its own bundle: Home and Library visitors never load the Profile code.
            // The guard below runs in parallel with this download, so a guest who
            // opens /profile still fetches it before being redirected.
            lazy: async () => {
              const { ProfilePage } = await import("../pages/profile/ProfilePage");
              return { Component: ProfilePage };
            },
            loader: requireProfileAccess,
            handle: signedInOnly,
          },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
];
