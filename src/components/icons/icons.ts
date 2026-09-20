// The brand mark now lives at /favicon.svg (referenced directly as an <img>
// by header/footer/mobile-menu) so it can't drift out of sync with the tab icon.
// Google's "G" is the only remaining hand-drawn mark — everything else uses
// the official Google Material Symbols Outlined webfont (see materialIcon
// in utils/icon.ts) to match Figma exactly.
export const icons = {
  google: `<svg viewBox="0 0 24 24"><path fill="#4285F4" d="M23.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.47a5.54 5.54 0 0 1-2.4 3.64v3h3.88c2.27-2.09 3.55-5.17 3.55-8.67z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.94-2.92l-3.88-3a7.15 7.15 0 0 1-10.61-3.76H1.46v3.09A12 12 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.45 14.32a7.2 7.2 0 0 1 0-4.63V6.6H1.46a12 12 0 0 0 0 10.8l3.99-3.08z"/><path fill="#EA4335" d="M12 4.77c1.76 0 3.35.6 4.6 1.8l3.44-3.44C17.94 1.2 15.24 0 12 0A12 12 0 0 0 1.46 6.6l3.99 3.09A7.15 7.15 0 0 1 12 4.77z"/></svg>`,
  // Matches the mockup's named "upload.svg" asset exactly (stroke swapped for
  // currentColor so it follows the button's text color like every other icon).
  upload: `<svg viewBox="0 0 24 24" fill="none"><path d="M12 3V15M7 8L12 3L17 8M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
};
