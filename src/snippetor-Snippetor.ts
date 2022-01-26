import { App, Notice } from "obsidian";
import {
    OldTaskSettings,
    SnippetConfig,
    TaskSettings,
    TaskSnippetConfig,
} from "./@types";
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
        return (
            this.app.plugins.plugins["obsidian-task-collector"] !== undefined
        );
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
        return new Set((values + "xX").replace(" ", "").split(""));
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
            checkbox: {
                lightMode: {
                    foreground: randomColor({
                        luminosity: "dark",
                    }),
                },
                darkMode: {
                    foreground: randomColor({
                        luminosity: "light",
                    }),
                },
            },
            li: {
                lightMode: {},
                darkMode: {},
            },
            cache: {
                expanded: false,
            },
        };
    }

    initConfig(cfg: Partial<TaskSnippetConfig>): void {
        cfg.taskSettings.forEach((ts) => {
            this.initTaskSettings(cfg.version, ts);
        });
        if (cfg.uncheckedTask) {
            this.initTaskSettings(cfg.version, cfg.uncheckedTask);
            if (cfg.version === null) {
                this.convertTaskSettings(cfg.uncheckedTask);
            }
        }
        cfg.version = "0.1.6";
    }

    initTaskSettings(version: string, ts: Partial<TaskSettings>): void {
        console.log("init task settings");
        this.initialize(ts, "cache");
        this.initialize(ts, "checkbox", "lightMode");
        this.initialize(ts, "checkbox", "darkMode");
        this.initialize(ts, "li");
        this.initialize(ts, "li", "lightMode");
        this.initialize(ts, "li", "darkMode");

        if (version === undefined) {
            this.convertTaskSettings(ts);
        }
    }

    private convertTaskSettings(ts: Partial<OldTaskSettings>): TaskSettings {
        if (ts.reader) {
            ts.checkbox.readModeData = ts.reader;
            delete ts.reader;
        }

        if (ts.hideBorder) {
            ts.checkbox.hideBorder = ts.hideBorder;
            delete ts.hideBorder;
        }

        if (ts.fontSize) {
            this.initialize(ts, "checkbox", "format");
            ts.checkbox.format.fontSize = ts.fontSize;
            delete ts.fontSize;
        }

        if (ts.taskColorLight) {
            ts.checkbox.lightMode.foreground = ts.taskColorLight;
            delete ts.taskColorLight;
        }
        if (ts.taskColorDark) {
            ts.checkbox.darkMode.foreground = ts.taskColorDark;
            delete ts.taskColorDark;
        }
        if (ts.applyTextColor || ts.applyTextBgColor) {
            this.initialize(ts, "li");
            ts.li.syncTaskColor = true;
            delete ts.applyTextColor;
            delete ts.applyTextBgColor;
        }

        if (ts.bgColorLight) {
            ts.checkbox.lightMode.background = ts.bgColorLight;
            if (ts.applyTextBgColor) {
                ts.li.lightMode.background = ts.bgColorLight;
            }
            delete ts.bgColorLight;
        }
        if (ts.bgColorDark) {
            ts.checkbox.darkMode.background = ts.bgColorDark;
            if (ts.applyTextBgColor) {
                ts.li.darkMode.background = ts.bgColorDark;
            }
            delete ts.bgColorDark;
        }

        if (ts.strikethrough) {
            this.initialize(ts, "li", "format");

            if (ts.strikethrough) {
                ts.li.format.strikethrough = ts.strikethrough;
                delete ts.strikethrough;
            }
        }

        return ts as TaskSettings;
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
                    new Notice(`Updated ${fileName}`);
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
                    new Notice(`Created ${fileName}`);
                },
                (reason) => {
                    new Notice(
                        "Snippet creation failed. Check console for details."
                    );
                    console.error("Snippet creation failed: %o", reason);
                }
            );
        }
        return update.then(() => this.app.customCss.readCssFolders()); // refresh snippets
    }

    isTaskSnippetConfig(cfg: SnippetConfig): cfg is TaskSnippetConfig {
        return cfg.type === DEFAULT_TASK_SNIPPET_SETTINGS.type;
    }

    async deleteSnippet(cfg: SnippetConfig): Promise<void> {
        const fileName = cfg.type + "-" + cfg.name;
        const path = this.app.customCss.getSnippetPath(fileName);
        const exists = await this.app.vault.adapter.exists(path);

        if (exists) {
            return this.app.vault.adapter.remove(path).then(
                () => {
                    new Notice(`Deleted ${fileName}`);
                },
                (reason) => {
                    new Notice(
                        "Snippet deletion failed. Check console for details."
                    );
                    console.error("Snippet creation failed: %o", reason);
                }
            );
        }

        return Promise.resolve();
    }

    /* eslint-disable */
    initialize(root: any, ...args: string[]): void {
        let o = root;
        args.forEach((arg) => {
            if (o[arg] === undefined) {
                o[arg] = {};
            }
            o = o[arg];
        });
    }
    /* eslint-enable */
}
