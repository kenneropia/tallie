import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: ["node_modules", "dist", "coverage", "build"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
        },
      ],
      "no-console": "off",
      semi: ["error", "always"],
      quotes: ["error", "double"],
      indent: ["error", 2],
    },
  },
  {
    files: ["tests/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.test.json",
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
        },
      ],
      "no-console": "off",
      semi: ["error", "always"],
      quotes: ["error", "double"],
      indent: ["error", 2],
    },
  },
];
