import { Navigate, redirect, type RouteObject } from "react-router";
import { getActiveSession } from "../auth/session";
import { showSnackbar } from "../hooks/snackbar-store";
import { HomePage } from "../pages/home/HomePage";
import { AppLayout, type RouteHandle } from "./AppLayout";

const TITLES = {
  home: "MiniGames — Take a Short Break & Have Fun",
  library: "Game Library — MiniGames",
  profile: "Your Profile — MiniGames",
  notFound: "Page Not Found — MiniGames",
} satisfies Record<string, string>;

const handle = (title: string, requiresSession = false): RouteHandle => ({
  title,
  requiresSession,
});

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
      { index: true, element: <HomePage />, handle: handle(TITLES.home) },
      { path: "home", element: <Navigate to="/" replace /> },
      { path: "index.html", element: <Navigate to="/" replace /> },
      { path: "library", handle: handle(TITLES.library) },
      {
        path: "profile",
        loader: requireProfileAccess,
        handle: handle(TITLES.profile, true),
      },
      { path: "*", handle: handle(TITLES.notFound) },
    ],
  },
];
