# MiniGames

A responsive web app for discovering and playing casual mini-games, built as the RS School qualifying-stage project.

Home, Library and Profile pages, Auth and Game Details dialogs. Story 6 is a migration of the original vanilla TypeScript app (stories 1–5) to React with TypeScript; the behavior, styles and tests carry over.

## Tech Stack

- TypeScript
- React 19 + React Router 7 (data router, `createBrowserRouter`)
- Vite
- Sass (design tokens, no CSS framework or UI library)
- ESLint + Prettier + Husky
- Firebase Authentication (email/password and Google)
- Vitest + happy-dom + React Testing Library (unit and integration tests, v8 coverage)

## Getting Started

```bash
npm install
npm run dev      # start dev server
npm run build    # production build
npm run lint      # run ESLint
npm run format    # run Prettier
npm test          # run unit tests
npm run test:coverage  # run unit tests with a coverage table
```

## App Session

Firebase signs the user in; the app then keeps its own short session in
`localStorage` under the key:

```
minigames:akylbek04-minigames:app-session
```

It stores `displayName`, `email`, `authenticatedAt` (`Date.now()` at sign-in)
and `avatarUrl` when the account has a photo — no passwords or tokens. The
session lasts **5 minutes from sign-in**; reloading or using the app does not
extend it. When it expires, is logged out, or the stored value is invalid, the
key is removed, Firebase is signed out and the app returns to Guest Mode.

To check expiry in DevTools: Application → Local Storage → edit
`authenticatedAt` to a value more than 5 minutes in the past, then reload or
try a protected action (favorite, comment, like).

## Profile & Achievements

Signed-in users get a Profile page (`/profile`) with statistics, 10 unlockable
badges, recent activity, an avatar customizer (8 icons × 5 colors) and
settings (clear history, reset progress). Guests are sent to Log In.

Activity is recorded after each successful action (opening a game, adding a
favorite, posting a comment, liking a comment) and stored on this device only,
one record per email, under the key:

```
minigames:akylbek04-minigames:profile:<email>
```

It holds counters, the distinct games opened, the last 50 history entries, badge
unlock times and the chosen avatar. Logging out keeps it; "Reset all progress"
on the Profile page erases it. Invalid or edited values are ignored field by field.

## Project Structure

- `src/main.tsx`: entry. Creates the browser router (with the `/minigames/` base) and mounts the providers.
- `src/app/`: `routes.tsx` (route table, page titles, the `/profile` guard) and `AppLayout.tsx` (header, menu, footer, dialogs, snackbars).
- `src/pages/`: `HomePage`, `LibraryPage`, `ProfilePage`, `NotFoundPage`.
- `src/components/`: UI pieces (PascalCase `.tsx`), each with its SCSS.
- `src/hooks/`: `useSession`, `useProfile`, `useOverlay` (dialog state in the URL), `useAsyncResult`, the snackbar store.
- `src/api/`, `src/auth/`, `src/profile/`: framework-free logic (HTTP client, Firebase and the app session, profile store and achievements).
- `src/styles/`, `src/types/`, `src/assets/`.

The URL is the source of truth: `?game=<slug>` and `?auth=login|register` open the dialogs, and the Library query (`category`, `sort`, `page`) drives its one API request.
