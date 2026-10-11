# MiniGames

A responsive web app for discovering and playing casual mini-games, built as the RS School qualifying-stage project.

Home and Library pages, Auth and Game Details dialogs, implemented with TypeScript, HTML, and SCSS only — no frameworks, no UI libraries.

## Tech Stack

- TypeScript
- Vite
- Sass
- ESLint + Prettier + Husky
- Firebase Authentication (email/password and Google)
- Vitest + happy-dom (unit tests, v8 coverage)

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

## Project Structure

See [`src/`](./src) for the folder layout: `app`, `pages`, `components`, `styles`, `types`, `assets`.
