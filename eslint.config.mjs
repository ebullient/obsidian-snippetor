// eslint.config.mjs
import globals from "globals";
import tsparser from "@typescript-eslint/parser";
import { defineConfig, globalIgnores } from "eslint/config";
import obsidianmd from "eslint-plugin-obsidianmd";

export default defineConfig([
    globalIgnores([
        "build/",
        "test/",
        "*.mjs",
        "*.js",
        "package.json"
    ]),
    ...obsidianmd.configs.recommended,
    {
        files: ["src/**/*.ts", "mocks/**/*.ts", "*.ts"],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                project: "./tsconfig.json"
            },
            globals: { ...globals.node, ...globals.browser, vi: "readonly" },
        },
        // Optional project overrides
        rules: {
            "obsidianmd/ui/sentence-case": "off",
            "@typescript-eslint/no-deprecated": "warn",
        },
    },
]);
