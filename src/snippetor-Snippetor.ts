import { App } from "obsidian";
import { SnippetConfig, TaskSnippetConfig } from "./@types";
import {
    DEFAULT_TASK_SETTINGS,
    DEFAULT_TASK_SNIPPET_SETTINGS,
} from "./snippetor-Defaults";

export class Snippetor {
    constructor(private app: App) {}

    generateCss(cfg: SnippetConfig): Promise<void> {
        console.log("Create CSS file for snippet %o", cfg);

        return Promise.resolve();
    }

    isTaskSnippetConfig(cfg: SnippetConfig): cfg is TaskSnippetConfig {
        return cfg.type === DEFAULT_TASK_SNIPPET_SETTINGS.type;
    }
}
