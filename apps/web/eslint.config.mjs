import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated / vendor output that must never be linted:
    "storybook-static/**",
    "node_modules/**",
    "drizzle/**",
    "public/**",
    "*.config.*",
    "**/*.txt",
  ]),
]);

export default eslintConfig;
