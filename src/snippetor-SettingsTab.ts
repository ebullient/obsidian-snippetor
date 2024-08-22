import {
    App,
    ButtonComponent,
    ExtraButtonComponent,
    Notice,
    PluginSettingTab,
    Setting,
} from "obsidian";
import {
    FolderSnippetConfig,
    SnippetConfig,
    TaskSnippetConfig,
} from "./@types";
import SnippetorPlugin from "./main";
import { openCreateCheckboxModal } from "./snippetor-CreateCheckboxesModal";
import { openCreateFolderModal } from "./snippetor-CreateFoldersModal";
import {
    DEFAULT_FOLDER_SNIPPET_SETTINGS,
    DEFAULT_TASK_SNIPPET_SETTINGS,
} from "./snippetor-Defaults";

export class SnippetorSettingsTab extends PluginSettingTab {
    plugin: SnippetorPlugin;
    existingEl: HTMLDivElement;

    constructor(app: App, plugin: SnippetorPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    async display(): Promise<void> {
        await this.plugin.loadSettings();

        this.containerEl.empty();
        this.containerEl.addClass("snippetor-plugin-settings");

        this.containerEl.createEl("h2", { text: "Snippetor" });
        this.buildNewSnippet();

        this.existingEl = this.containerEl.createDiv();
        this.listExistingSnippets();

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
            .addButton((button: ButtonComponent) =>
                button
                    .setTooltip("Create a Snippet")
                    .setIcon("plus-with-circle")
                    .onClick(async () => {
                        await this.openModal(selector.type, null);
                    }),
            );
    }

    listExistingSnippets(): void {
        this.existingEl.empty(); // clear, used for refreshing

        for (const snippet of this.plugin.allSnippets) {
            new Setting(this.existingEl)
                .setName(snippet.name)
                .setDesc(this.getDescription(snippet.type))
                .addExtraButton((b: ExtraButtonComponent) =>
                    b
                        .setIcon("pencil")
                        .setTooltip("Edit this Snippet")
                        .onClick(async () => {
                            await this.openModal(snippet.type, snippet);
                            this.listExistingSnippets();
                        }),
                )
                .addExtraButton((b: ExtraButtonComponent) =>
                    b
                        .setIcon("duplicate-glyph")
                        .setTooltip("Copy this Snippet")
                        .onClick(async () => {
                            const copy = JSON.parse(JSON.stringify(snippet));
                            delete copy.id;
                            delete copy.name;
                            new Notice(`Copied snippet '${snippet.name}'`);
                            await this.openModal(snippet.type, copy);
                            this.listExistingSnippets();
                        }),
                )
                .addExtraButton((b: ExtraButtonComponent) =>
                    b
                        .setIcon("trash")
                        .setTooltip("Delete this Snippet")
                        .onClick(async () => {
                            await this.plugin.removeSnippet(snippet);
                            this.listExistingSnippets();
                        }),
                );
        }
    }

    getDescription(type: string): string {
        // Some day --- more types.
        let description: string;
        switch (type) {
            case "simple-task": {
                description = "simple checkboxes";
                break;
            }
            case "folder": {
                description = "colored folders";
                break;
            }
        }
        return description;
    }

    async openModal(type: string, snippet: SnippetConfig): Promise<void> {
        // Some day --- more types.
        if (type === DEFAULT_TASK_SNIPPET_SETTINGS.type) {
            const taskCfg = await openCreateCheckboxModal(
                this.app,
                snippet as TaskSnippetConfig,
                this.plugin.snippetor,
            );
            if (taskCfg) {
                console.debug("Snippetor: modal closed with %o", taskCfg);
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
                console.debug("Snippetor: modal closed with %o", taskCfg);
                await this.plugin.setSnippet(taskCfg);
            }
            this.listExistingSnippets();
        }
    }

    isLightMode(): boolean {
        return document.body.hasClass("theme-light");
    }
}
