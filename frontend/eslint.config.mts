import { FlatCompat } from "@eslint/eslintrc";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import reactRefreshPlugin from "eslint-plugin-react-refresh";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// FlatCompat helps convert legacy configs to flat config
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  // Include legacy recommended configs
  ...compat.extends(
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended"
  ),

  {
    ignores: ["dist", ".eslintrc.cjs"],

    files: ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        browser: true,
      },
    },

    settings: {
      react: {
        version: "18.2",
      },
    },

    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      "react-refresh": reactRefreshPlugin,
    },

    rules: {
      "react/jsx-no-target-blank": "off",
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  },
];