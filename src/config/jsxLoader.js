// Enables JSX and import/export syntax for .jsx email templates in this
// CommonJS application, powered by esbuild through tsx.
//
// Require this module before any module that imports a .jsx template.
// Plain .js files are unaffected and keep loading natively.
if (!globalThis.__jsxLoaderInstalled) {
  globalThis.__jsxLoaderInstalled = true;

  require("tsx/cjs");
}
