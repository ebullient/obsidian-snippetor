import { compare } from "compare-versions";
import { Eta } from "eta";
import { type App, Notice } from "obsidian";
import { generateSlug } from "random-word-slugs";
import randomColor from "randomcolor";
import type {
    FolderConfig,
    FolderSnippetConfig,
    OldTaskSettings,
    SnippetConfig,
    TaskSettings,
    TaskSnippetConfig,
} from "./@types";
import {
    DEFAULT_FOLDER_SNIPPET_SETTINGS,
    DEFAULT_TASK_SNIPPET_SETTINGS,
} from "./snippetor-Defaults";
import { COLORED_FOLDERS, SIMPLE_TASK } from "./snippetor-Snippetor-Templates";

export class Snippetor {
    eta: Eta;

    constructor(private app: App) {
        this.eta = new Eta({
            //views: path.join(scriptDir, "templates"),
            autoTrim: false,
            cache: true,
        });
    }

    get taskValues(): Set<string> {
        const tcPlugin = this.app.plugins.plugins["obsidian-task-collector"];
        if (tcPlugin) {
            let values = "";
            if (tcPlugin.api) {
                values += tcPlugin.api.getCompletedTaskValues();
                values += tcPlugin.api.getIncompleteTaskValues();
            } else {
                values += tcPlugin.taskCollector.settings.onlyLowercaseX
                    ? "x"
                    : "xX";
                values += tcPlugin.taskCollector.settings.supportCanceledTasks
                    ? "-"
                    : "";
                values += tcPlugin.taskCollector.settings.incompleteTaskValues;
            }
            return new Set(values.replace(" ", "").split(""));
        }
        // return a few as examples
        return new Set(["x", "-", ">"]);
    }

    createNewTaskSnippetCfg(): Partial<TaskSnippetConfig> {
        const result = Object.assign({}, DEFAULT_TASK_SNIPPET_SETTINGS, {
            id: this.generateId(),
            name: generateSlug(2),
            taskSettings: [],
        });
        for (const v of this.taskValues) {
            result.taskSettings.push(this.createNewTaskCfg(v));
        }
        return result;
    }
    createNewFolderSnippetCfg(): Partial<FolderSnippetConfig> {
        const result = Object.assign({}, DEFAULT_FOLDER_SNIPPET_SETTINGS, {
            id: this.generateId(),
            name: generateSlug(2),
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
    createNewFolderCfg(v: string): FolderConfig {
        return {
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
            target: v,
            cache: {
                folderEl: null,
                titleEl: null,
            },
        };
    }

    generateId(): string {
        return `${generateSlug(3)}-${randomColor()}`;
    }

    initCommonConfig(cfg: Partial<SnippetConfig>): void {
        if (!cfg.id) {
            cfg.id = this.generateId();
        }
        if (!cfg.name) {
            cfg.name = generateSlug(2);
        }
        cfg.version = "0.1.8";
    }

    initFolderSnippetConfig(
        cfg: Partial<FolderSnippetConfig>,
    ): FolderSnippetConfig {
        this.initCommonConfig(cfg); // last, it bumps the version
        return cfg as FolderSnippetConfig;
    }

    initTaskSnippetConfig(cfg: Partial<TaskSnippetConfig>): TaskSnippetConfig {
        for (const ts of cfg.taskSettings) {
            this.initTaskSettings(cfg.version, ts);
        }
        if (cfg.uncheckedTask) {
            this.initTaskSettings(cfg.version, cfg.uncheckedTask);
        }
        if (cfg.version === undefined || compare(cfg.version, "0.1.7", "<")) {
            Reflect.deleteProperty(cfg, "clearThemeBackground");
            cfg.baseFontSize = 14;
        }
        this.initCommonConfig(cfg); // last, it bumps the version

        return cfg as TaskSnippetConfig;
    }

    initTaskSettings(version: string, ts: Partial<TaskSettings>): void {
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
            ts.reader = undefined;
        }

        if (ts.hideBorder) {
            ts.checkbox.hideBorder = ts.hideBorder;
            ts.hideBorder = undefined;
        }

        if (ts.fontSize) {
            this.initialize(ts, "checkbox", "format");
            ts.checkbox.format.fontSize = ts.fontSize;
            ts.fontSize = undefined;
        }

        if (ts.taskColorLight) {
            ts.checkbox.lightMode.foreground = ts.taskColorLight;
            ts.taskColorLight = undefined;
        }
        if (ts.taskColorDark) {
            ts.checkbox.darkMode.foreground = ts.taskColorDark;
            ts.taskColorDark = undefined;
        }
        if (ts.applyTextColor || ts.applyTextBgColor) {
            this.initialize(ts, "li");
            ts.li.syncTaskColor = true;
            ts.applyTextColor = undefined;
            ts.applyTextBgColor = undefined;
        }

        if (ts.bgColorLight) {
            ts.checkbox.lightMode.background = ts.bgColorLight;
            if (ts.applyTextBgColor) {
                ts.li.lightMode.background = ts.bgColorLight;
            }
            ts.bgColorLight = undefined;
        }
        if (ts.bgColorDark) {
            ts.checkbox.darkMode.background = ts.bgColorDark;
            if (ts.applyTextBgColor) {
                ts.li.darkMode.background = ts.bgColorDark;
            }
            ts.bgColorDark = undefined;
        }

        if (ts.strikethrough) {
            this.initialize(ts, "li", "format");

            if (ts.strikethrough) {
                ts.li.format.strikethrough = ts.strikethrough;
                ts.strikethrough = undefined;
            }
        }

        return ts as TaskSettings;
    }

    async generateCss(cfg: SnippetConfig): Promise<void> {
        if (!cfg.name) {
            new Notice("Unable to create snippet: Missing file name.");
            return Promise.reject();
        }
        let snippet: string;
        switch (cfg.type) {
            case DEFAULT_TASK_SNIPPET_SETTINGS.type: {
                snippet = this.eta.renderString(SIMPLE_TASK, {
                    date: new Date(),
                    cfg,
                });
                break;
            }
            case DEFAULT_FOLDER_SNIPPET_SETTINGS.type: {
                snippet = this.eta.renderString(COLORED_FOLDERS, {
                    date: new Date(),
                    cfg,
                });
                break;
            }
        }
        if (!snippet) {
            new Notice(
                "Unable to create snippet: Content is empty. Check console for details.",
            );
            return Promise.reject();
        }

        const fileName = `${cfg.type}-${cfg.name}`;
        const path = this.app.customCss.getSnippetPath(fileName);
        const exists = await this.app.vault.adapter.exists(path);
        console.log("Create CSS file %s for snippet %o", fileName, cfg);

        let update: Promise<void>;
        if (exists) {
            update = this.app.vault.adapter.write(path, snippet as string).then(
                () => {
                    new Notice(`Updated ${fileName}`);
                },
                (reason) => {
                    new Notice(
                        "Snippet modification failed. Check console for details.",
                    );
                    console.error("Snippet modification failed: %o", reason);
                },
            );
        } else {
            update = this.app.vault.create(path, snippet as string).then(
                () => {
                    new Notice(`Created ${fileName}`);
                },
                (reason) => {
                    new Notice(
                        "Snippet creation failed. Check console for details.",
                    );
                    console.error("Snippet creation failed: %o", reason);
                },
            );
        }
        return update.then(() => this.app.customCss.readSnippets()); // refresh snippets
    }

    isTaskSnippetConfig(cfg: SnippetConfig): cfg is TaskSnippetConfig {
        return cfg.type === DEFAULT_TASK_SNIPPET_SETTINGS.type;
    }

    async deleteSnippet(cfg: SnippetConfig): Promise<void> {
        const fileName = `${cfg.type}-${cfg.name}`;
        const path = this.app.customCss.getSnippetPath(fileName);
        const exists = await this.app.vault.adapter.exists(path);

        if (exists) {
            return this.app.vault.adapter.remove(path).then(
                () => {
                    new Notice(`Deleted ${fileName}`);
                },
                (reason) => {
                    new Notice(
                        "Snippet deletion failed. Check console for details.",
                    );
                    console.error("Snippet creation failed: %o", reason);
                },
            );
        }

        return Promise.resolve();
    }

    // biome-ignore lint/suspicious/noExplicitAny: nested object initialization
    initialize(root: any, ...args: string[]): void {
        let o = root;
        for (const arg of args) {
            if (o[arg] === undefined) {
                o[arg] = {};
            }
            o = o[arg];
        }
    }
}
