import js from "@eslint/js";
import tailwindcss from "eslint-plugin-tailwindcss";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  tailwindcss.configs.recommended,
  prettier,
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        React: "readonly",
      },
    },
    settings: {
      tailwindcss: {
        cssConfigPath: "./src/index.css",
        functions: ["classnames", "clsx", "ctl", "cn", "cva", "tw"],
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    ignores: ["dist", "node_modules", ".bun", "*.wasm", "*.lock", "public"],
  },
];
