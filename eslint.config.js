import eslint from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import prettier from "eslint-config-prettier";

export default [
  eslint.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
    },
  },
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      globals: {
        window: "readonly",
        document: "readonly",
        HTMLCanvasElement: "readonly",
        console: "readonly",
      },
    },
  },
  {
    files: ["playwright.config.ts"],
    languageOptions: {
      globals: {
        process: "readonly",
      },
    },
  },
  prettier,
];
