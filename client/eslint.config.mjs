import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    "public/**",
    "dist/**",
    "components/ui/**",
  ]),
  {
    rules: {
      "@typescript-eslint/ban-ts-comment": [
        "warn",
        {
          "ts-expect-error": true,
          "ts-ignore": true,
          "ts-nocheck": true,
        },
      ],
    },
  },
  {
    files: ["src/api/**/*.{ts,tsx,js,jsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "on",
      "@typescript-eslint/ban-ts-comment": [
        "off",
        {
          "ts-expect-error": false,
        },
      ],
    },
  },
]);

export default eslintConfig;
