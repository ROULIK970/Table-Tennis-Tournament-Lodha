/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["@repo/eslint-config/next.js", "plugin:jsx-a11y/recommended"],
  parser: "@typescript-eslint/parser",
  plugins: ["jsx-a11y"],
  parserOptions: {
    project: true,
  },
  rules: {
    "no-console": ["warn", { allow: ["warn", "error"] }],
    "@next/next/no-html-link-for-pages": "off",
    "no-unused-vars": "warn",
    "react/function-component-definition": "off",
    "react/hook-use-state": "off",
    "react/jsx-no-leaked-render": "off",
    "react/jsx-sort-props": "off",
    "react/no-array-index-key": "off",
    "turbo/no-undeclared-env-vars": "off",
  },
}
