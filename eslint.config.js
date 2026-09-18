import js from "@eslint/js";
import tseslint from "typescript-eslint";
import unicorn from "eslint-plugin-unicorn";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
  { ignores: ["dist", "node_modules"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  unicorn.configs.recommended,
  prettier,
  {
    languageOptions: {
      globals: globals.browser,
    },
    linterOptions: {
      noInlineConfig: true,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "unicorn/prevent-abbreviations": "off",
      "unicorn/filename-case": ["error", { case: "kebabCase" }],
      // short, conventional names (el, attrs, props...) read fine in small DOM helpers
      "unicorn/name-replacements": "off",
      // nested el() calls are the whole point of a hyperscript-style DOM builder
      "unicorn/max-nested-calls": "off",
    },
  },
);
