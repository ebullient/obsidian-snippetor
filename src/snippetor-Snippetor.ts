import { App, Notice } from "obsidian";
import { SnippetConfig, TaskSettings, TaskSnippetConfig } from "./@types";
import { DEFAULT_TASK_SNIPPET_SETTINGS } from "./snippetor-Defaults";
import * as Eta from "eta";
import { SIMPLE_TASK } from "./snippetor-Snippetor-Templates";
import { generateSlug } from "random-word-slugs";
import randomColor from "randomcolor";

export class Snippetor {
    constructor(private app: App) {
        Eta.configure({
            cache: true, // Make Eta cache templates
            async: false,
        });
    }

    get canUseTaskCollector(): boolean {
        return this.app.plugins.enabledPlugins.has("obsidian-task-collector");
    }

    get taskValues(): Set<string> {
        let values =
            this.app.plugins.plugins["obsidian-task-collector"].taskCollector
                .settings.incompleteTaskValues;
        if (
            this.app.plugins.plugins["obsidian-task-collector"].taskCollector
                .settings.supportCanceledTasks
        ) {
            values += "-";
        }
        const tasks = (values + "xX").replace(" ", "").split("");
        tasks.sort();
        return new Set(tasks);
    }

    createNewTaskSnippetCfg(): TaskSnippetConfig {
        const result = Object.assign({}, DEFAULT_TASK_SNIPPET_SETTINGS, {
            name: generateSlug(2),
            taskSettings: [],
        });
        let values = new Set(["x", "-", ">"]);
        if (this.canUseTaskCollector) {
            values = this.taskValues;
        }
        values.forEach((v) => {
            result.taskSettings.push(this.createNewTaskCfg(v));
        });
        return result;
    }

    createNewTaskCfg(v: string): TaskSettings {
        return {
            data: v,
            taskColorLight: randomColor({
                luminosity: "dark",
            }),
            taskColorDark: randomColor({
                luminosity: "light",
            }),
        };
    }

    generateCss(cfg: SnippetConfig): Promise<void> {
        console.log("Create CSS file for snippet %o", cfg);
        if (!cfg.name) {
            new Notice("Unable to create snippet: Missing file name.");
            return Promise.reject();
        }
        let snippet;
        if (this.isTaskSnippetConfig(cfg)) {
            snippet = Eta.render(SIMPLE_TASK, {
                date: new Date(),
                cfg,
            });
        }
        if (!snippet) {
            new Notice(
                "Unable to create snippet: Content is empty. Check console for details."
            );
            return Promise.reject();
        }

        const fileName = cfg.type + "-" + cfg.name;
        const path = this.app.customCss.getSnippetPath(fileName);
        let update;
        if (this.app.customCss.snippets.includes(fileName)) {
            update = this.app.vault.adapter.write(path, snippet as string).then(
                () => {
                    new Notice("Snippet updated successfully.");
                },
                (reason) => {
                    new Notice(
                        "Snippet modification failed. Check console for details."
                    );
                    console.error("Snippet modification failed: %o", reason);
                }
            );
        } else {
            update = this.app.vault.create(path, snippet as string).then(
                () => {
                    new Notice("Snippet created successfully.");
                },
                (reason) => {
                    new Notice(
                        "Snippet creation failed. Check console for details."
                    );
                    console.error("Snippet creation failed: %o", reason);
                }
            );
        }
        this.app.customCss.readCssFolders(); // refresh snippets
        return update.then();
    }

    isTaskSnippetConfig(cfg: SnippetConfig): cfg is TaskSnippetConfig {
        return cfg.type === DEFAULT_TASK_SNIPPET_SETTINGS.type;
    }
}
