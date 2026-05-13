import {
    type App,
    type ExtraButtonComponent,
    Notice,
    PluginSettingTab,
    Setting,
} from "obsidian";
import type {
    FolderSnippetConfig,
    SnippetConfig,
    SnippetorSettings,
    TaskSnippetConfig,
} from "./@types";
import type SnippetorPlugin from "./main";
import { openCreateCheckboxModal } from "./snippetor-CreateCheckboxesModal";
import { openCreateFolderModal } from "./snippetor-CreateFoldersModal";
import {
    DEFAULT_FOLDER_SNIPPET_SETTINGS,
    DEFAULT_TASK_SNIPPET_SETTINGS,
} from "./snippetor-Defaults";

export class SnippetorSettingsTab extends PluginSettingTab {
    plugin: SnippetorPlugin;
    newSettings!: SnippetorSettings;
    existingEl!: HTMLDivElement;

    constructor(app: App, plugin: SnippetorPlugin) {
        super(app, plugin);
        this.plugin = plugin;
        this.icon = "stamp";
    }

    async save(): Promise<void> {
        this.plugin.settings = this.newSettings;
        await this.plugin.saveSettings();
    }

    private cloneSettings(): SnippetorSettings {
        return JSON.parse(
            JSON.stringify(this.plugin.settings),
        ) as SnippetorSettings;
    }

    reset(): void {
        this.newSettings = this.cloneSettings();
        this.display();
    }

    display(): void {
        if (!this.newSettings) {
            this.newSettings = this.cloneSettings();
        }

        this.containerEl.empty();
        this.containerEl.addClass("snippetor-plugin-settings");

        new Setting(this.containerEl)
            .setName("Save settings")
            .setClass("snippetor-save-reset")
            .addButton((button) =>
                button
                    .setIcon("reset")
                    .setTooltip("Reset to previously saved values")
                    .onClick(() => {
                        this.reset();
                    }),
            )
            .addButton((button) => {
                button
                    .setIcon("save")
                    .setCta()
                    .setTooltip("Save all changes")
                    .onClick(async () => {
                        await this.save();
                    });
            });

        new Setting(this.containerEl).setName("Snippets").setHeading();

        this.buildNewSnippet();

        this.existingEl = this.containerEl.createDiv();
        this.listExistingSnippets();

        new Setting(this.containerEl).setName("Debugging").setHeading();

        new Setting(this.containerEl)
            .setName("Debug")
            .setDesc("Enable debug messages in the console")
            .addToggle((toggle) =>
                toggle.setValue(this.newSettings.debug).onChange((value) => {
                    this.newSettings.debug = value;
                }),
            );

        const div = this.containerEl.createDiv("coffee");
        const fgColor = this.isLightMode() ? "666" : "AAA";
        const bgColor = this.isLightMode() ? "D8C9D5" : "684B62";
        div.createEl("a", {
            href: "https://www.buymeacoffee.com/ebullient",
        }).createEl("img", {
            attr: {
                src: `https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=ebullient&button_colour=${bgColor}&font_colour=${fgColor}&font_family=Inter&outline_colour=${fgColor}&coffee_colour=FFDD00`,
            },
        });
    }

    /** Save on exit */
    hide(): void {
        void this.save();
    }

    buildNewSnippet(): void {
        const selector = {
            type: DEFAULT_TASK_SNIPPET_SETTINGS.type,
        };
        new Setting(this.containerEl)
            .setClass("snippetor-create-snippet")
            .setName("Create a new CSS snippet (select type)")
            .addDropdown((d) => {
                d.addOption(
                    DEFAULT_TASK_SNIPPET_SETTINGS.type,
                    "Custom checkboxes",
                );
                d.setValue(DEFAULT_TASK_SNIPPET_SETTINGS.type);

                d.addOption(
                    DEFAULT_FOLDER_SNIPPET_SETTINGS.type,
                    "Colored folders",
                );

                d.onChange((v) => {
                    selector.type = v;
                });
            })
            .addButton((button) =>
                button
                    .setTooltip("Create a snippet")
                    .setIcon("plus-with-circle")
                    .onClick(async () => {
                        await this.openModal(selector.type, null);
                    }),
            );
    }

    listExistingSnippets(): void {
        this.existingEl.empty();

        for (const snippet of this.plugin.allSnippets) {
            new Setting(this.existingEl)
                .setName(snippet.name)
                .setDesc(this.getDescription(snippet.type))
                .addExtraButton((b: ExtraButtonComponent) =>
                    b
                        .setIcon("pencil")
                        .setTooltip("Edit this snippet")
                        .onClick(async () => {
                            await this.openModal(snippet.type, snippet);
                            this.listExistingSnippets();
                        }),
                )
                .addExtraButton((b: ExtraButtonComponent) =>
                    b
                        .setIcon("duplicate-glyph")
                        .setTooltip("Copy this snippet")
                        .onClick(async () => {
                            const copy = JSON.parse(
                                JSON.stringify(snippet),
                            ) as SnippetConfig;
                            Reflect.deleteProperty(copy, "id");
                            Reflect.deleteProperty(copy, "name");
                            new Notice(`Copied snippet '${snippet.name}'`);
                            await this.openModal(snippet.type, copy);
                            this.listExistingSnippets();
                        }),
                )
                .addExtraButton((b: ExtraButtonComponent) =>
                    b
                        .setIcon("trash")
                        .setTooltip("Delete this snippet")
                        .onClick(async () => {
                            await this.plugin.removeSnippet(snippet);
                            this.listExistingSnippets();
                        }),
                );
        }
    }

    getDescription(type: string): string {
        switch (type) {
            case "simple-task":
                return "simple checkboxes";
            case "folder":
                return "colored folders";
            default:
                return type;
        }
    }

    async openModal(
        type: string,
        snippet: SnippetConfig | null,
    ): Promise<void> {
        if (type === DEFAULT_TASK_SNIPPET_SETTINGS.type) {
            const taskCfg = await openCreateCheckboxModal(
                this.app,
                snippet as TaskSnippetConfig,
                this.plugin.snippetor,
            );
            if (taskCfg) {
                this.plugin.snippetor.logDebug("modal closed with %o", taskCfg);
                await this.plugin.setSnippet(taskCfg);
            }
            this.listExistingSnippets();
        } else if (type === DEFAULT_FOLDER_SNIPPET_SETTINGS.type) {
            const taskCfg = await openCreateFolderModal(
                this.app,
                snippet as FolderSnippetConfig,
                this.plugin.snippetor,
            );
            if (taskCfg) {
                this.plugin.snippetor.logDebug("modal closed with %o", taskCfg);
                await this.plugin.setSnippet(taskCfg);
            }
            this.listExistingSnippets();
        }
    }

    isLightMode(): boolean {
        return activeDocument.body.hasClass("theme-light");
    }
}
