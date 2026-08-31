const eslint = require("@eslint/js");
const eslintConfigPrettier = require("eslint-config-prettier");
const globals = require("globals");

module.exports = [
  {
    ignores: ["node_modules/", "coverage/"],
  },
  eslint.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-console": "off",
    },
  },
  {
    files: ["**/*.jsx"],
    languageOptions: {
      ecmaVersion: "latest",
      // Templates are authored with import/export; tsx transpiles
      // them to CommonJS at require time (src/config/jsxLoader.js).
      sourceType: "module",
      globals: {
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      // JSX compiles to React.createElement calls, which static analysis
      // cannot see, so the explicit React import looks unused.
      "no-unused-vars": [
        "error",
        { varsIgnorePattern: "^React$", argsIgnorePattern: "^React$" },
      ],
    },
  },
  eslintConfigPrettier,
];
