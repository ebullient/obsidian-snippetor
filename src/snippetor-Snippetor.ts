import { App } from "obsidian";
import { SnippetConfig, TaskSnippetConfig } from "./@types";
import {
    DEFAULT_TASK_SNIPPET_SETTINGS,
} from "./snippetor-Defaults";
import * as Eta from "eta";
import { SIMPLE_TASK } from "./snippetor-Snippetor-Templates";

export class Snippetor {
    constructor(private app: App) {
        Eta.configure({
            cache: true, // Make Eta cache templates
        });
    }

    generateCss(cfg: SnippetConfig): Promise<void> {
        console.log("Create CSS file for snippet %o", cfg);
        if ( this.isTaskSnippetConfig(cfg) ) {
            console.log(Eta.render(SIMPLE_TASK, {
                date: new Date(),
                cfg
            } ));
        }

        return Promise.resolve();
    }

    isTaskSnippetConfig(cfg: SnippetConfig): cfg is TaskSnippetConfig {
        return cfg.type === DEFAULT_TASK_SNIPPET_SETTINGS.type;
    }
}
