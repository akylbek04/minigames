// The brand mark now lives at /favicon.svg (referenced directly as an <img>
// by header/footer/mobile-menu) so it can't drift out of sync with the tab icon.
// Google's "G" is the only remaining hand-drawn mark — everything else uses
// the official Google Material Symbols Outlined webfont (see materialIcon
// in utils/icon.ts) to match Figma exactly.
export const icons = {
  google: `<svg viewBox="0 0 24 24"><path fill="#4285F4" d="M23.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.47a5.54 5.54 0 0 1-2.4 3.64v3h3.88c2.27-2.09 3.55-5.17 3.55-8.67z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.94-2.92l-3.88-3a7.15 7.15 0 0 1-10.61-3.76H1.46v3.09A12 12 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.45 14.32a7.2 7.2 0 0 1 0-4.63V6.6H1.46a12 12 0 0 0 0 10.8l3.99-3.08z"/><path fill="#EA4335" d="M12 4.77c1.76 0 3.35.6 4.6 1.8l3.44-3.44C17.94 1.2 15.24 0 12 0A12 12 0 0 0 1.46 6.6l3.99 3.09A7.15 7.15 0 0 1 12 4.77z"/></svg>`,
};
