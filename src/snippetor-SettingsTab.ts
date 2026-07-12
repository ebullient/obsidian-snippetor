import {
    type App,
    type ExtraButtonComponent,
    Notice,
    PluginSettingTab,
    Setting,
    type SettingDefinitionItem,
} from "obsidian";
import type {
    FolderSnippetConfig,
    SnippetConfig,
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
    existingEl!: HTMLDivElement;

    constructor(app: App, plugin: SnippetorPlugin) {
        super(app, plugin);
        this.plugin = plugin;
        this.icon = "stamp";
    }

    // ---- 1.13.0+: declarative path ----

    getSettingDefinitions(): SettingDefinitionItem[] {
        this.containerEl.addClass("snippetor-plugin-settings");

        return [
            {
                name: "Create a new CSS snippet (select type)",
                render: (setting) =>
                    this.renderCreateRow(setting, () => {
                        // eslint-disable-next-line obsidianmd/no-unsupported-api -- only invoked from within getSettingDefinitions(), which the host only calls on 1.13.0+
                        this.update();
                    }),
            },
            {
                type: "list",
                heading: "Snippets",
                items: this.plugin.allSnippets.map((snippet) => ({
                    name: snippet.name,
                    desc: this.getDescription(snippet.type),
                    render: (setting) =>
                        this.renderSnippetRow(setting, snippet, () => {
                            // eslint-disable-next-line obsidianmd/no-unsupported-api -- only invoked from within getSettingDefinitions(), which the host only calls on 1.13.0+
                            this.update();
                        }),
                })),
            },
            {
                name: "Debug",
                desc: "Enable debug messages in the console",
                control: { type: "toggle", key: "debug" },
            },
            {
                name: "",
                render: (setting) => this.renderCoffeeRow(setting),
            },
        ];
    }

    // ---- < 1.13.0: imperative fallback, save-on-change, kept in sync with above ----

    display(): void {
        this.containerEl.empty();
        this.containerEl.addClass("snippetor-plugin-settings");

        this.renderCreateRow(
            new Setting(this.containerEl).setClass("snippetor-create-snippet"),
            () => {
                this.listExistingSnippets();
            },
        );

        new Setting(this.containerEl).setName("Snippets").setHeading();
        this.existingEl = this.containerEl.createDiv();
        this.listExistingSnippets();

        new Setting(this.containerEl)
            .setName("Debug")
            .setDesc("Enable debug messages in the console")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.debug)
                    .onChange(async (value) => {
                        this.plugin.settings.debug = value;
                        await this.plugin.saveSettings();
                    }),
            );

        this.renderCoffeeRow(new Setting(this.containerEl));
    }

    listExistingSnippets(): void {
        this.existingEl.empty();
        for (const snippet of this.plugin.allSnippets) {
            this.renderSnippetRow(new Setting(this.existingEl), snippet, () => {
                this.listExistingSnippets();
            });
        }
    }

    // ---- shared row builders ----

    private renderCreateRow(setting: Setting, onCreated: () => void): void {
        const selector = { type: DEFAULT_TASK_SNIPPET_SETTINGS.type };
        setting
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
                        onCreated();
                    }),
            );
    }

    private renderSnippetRow(
        setting: Setting,
        snippet: SnippetConfig,
        onChanged: () => void,
    ): void {
        setting
            .setName(snippet.name)
            .setDesc(this.getDescription(snippet.type))
            .addExtraButton((b: ExtraButtonComponent) =>
                b
                    .setIcon("pencil")
                    .setTooltip("Edit this snippet")
                    .onClick(async () => {
                        await this.openModal(snippet.type, snippet);
                        onChanged();
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
                        onChanged();
                    }),
            )
            .addExtraButton((b: ExtraButtonComponent) =>
                b
                    .setIcon("trash")
                    .setTooltip("Delete this snippet")
                    .onClick(async () => {
                        await this.plugin.removeSnippet(snippet);
                        onChanged();
                    }),
            );
    }

    private renderCoffeeRow(setting: Setting): void {
        setting.settingEl.empty();
        const div = setting.settingEl.createDiv("coffee");
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
        } else if (type === DEFAULT_FOLDER_SNIPPET_SETTINGS.type) {
            const folderCfg = await openCreateFolderModal(
                this.app,
                snippet as FolderSnippetConfig,
                this.plugin.snippetor,
            );
            if (folderCfg) {
                this.plugin.snippetor.logDebug(
                    "modal closed with %o",
                    folderCfg,
                );
                await this.plugin.setSnippet(folderCfg);
            }
        }
    }

    isLightMode(): boolean {
        return activeDocument.body.hasClass("theme-light");
    }
}
