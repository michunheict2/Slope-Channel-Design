import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      // Allow 'any' type for dynamic imports and external libraries (warn instead of error)
      "@typescript-eslint/no-explicit-any": "warn",
      
      // Allow unused variables that start with underscore
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
          "caughtErrorsIgnorePattern": "^_"
        }
      ],
      
      // Relax React Hook dependency warnings for complex scenarios
      "react-hooks/exhaustive-deps": "warn",
      
      // Allow unescaped entities in JSX (for better readability)
      "react/no-unescaped-entities": "warn",
      
      // Allow console.log in development
      "no-console": "warn"
    }
  }
];

export default eslintConfig;
