// Hand-drawn/brand marks live as real .svg files in assets/icons and are
// imported as raw markup (Vite's ?raw import) so they still render inline
// via utils/icon.ts's icon() helper - keeping CSS control over size/color
// (currentColor) exactly like before, just with the source as an editable
// file instead of an inline string.
//
// The Material Symbols Outlined webfont (see materialIcon in utils/icon.ts)
// covers everything else, to match Figma exactly.
import google from "../../assets/icons/google.svg?raw";
import upload from "../../assets/icons/upload.svg?raw";
import share from "../../assets/icons/share.svg?raw";
import chat from "../../assets/icons/chat.svg?raw";
import rssFeed from "../../assets/icons/rss-feed.svg?raw";
import rsLogo from "../../assets/icons/rs-logo.svg?raw";
import github from "../../assets/icons/github.svg?raw";

export const icons = {
  google,
  upload,
  share,
  chat,
  rssFeed,
  // Self-contained badges with their own fixed color scheme (not meant to
  // inherit surrounding text color like the other icons above).
  rsLogo,
  github,
};
