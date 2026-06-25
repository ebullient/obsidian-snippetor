import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "jsdom",
        globals: true,
        moduleDirectories: ["node_modules", "src", "test"],
    },
    resolve: {
        alias: {
            obsidian: new URL("./mocks/obsidian.ts", import.meta.url).pathname,
        },
    },
    assetsInclude: ["**/*.eta"],
});
