import {
    App,
    ButtonComponent,
    ButtonComponent,
    Notice,
    PluginSettingTab,
    Setting,
} from "obsidian";
import { generateSlug } from "random-word-slugs";
import { SnippetConfig, SnippetorSettings, TaskSnippetConfig } from "./@types";
import SnippetorPlugin from "./main";
import { openCreateCheckboxModal } from "./snippetor-CreateCheckboxesModal";
import { DEFAULT_TASK_SNIPPET_SETTINGS } from "./snippetor-Defaults";

export class SnippetorSettingsTab extends PluginSettingTab {
    plugin: SnippetorPlugin;
    existingEl: HTMLDivElement;

    constructor(app: App, plugin: SnippetorPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
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

    buildNewSnippet() {
        const selector = {
            type: DEFAULT_TASK_SNIPPET_SETTINGS.type,
        };
        new Setting(this.containerEl)
            .setClass("snippetor-create-snippet")
            .setName("Create a new CSS snippet (select type)")
            .addDropdown((d) => {
                d.addOption(
                    DEFAULT_TASK_SNIPPET_SETTINGS.type,
                    "Custom checkboxes"
                );
                d.setValue(DEFAULT_TASK_SNIPPET_SETTINGS.type);
                d.onChange((v) => {
                    selector.type = v;
                });
            })
            .addButton((button: ButtonComponent) =>
                button
                    .setTooltip("Create a Snippet")
                    .setButtonText("+")
                    .onClick(async () => {
                        await this.openModal(selector.type, null);
                    })
            );
    }

    listExistingSnippets() {
        this.existingEl.empty(); // clear, used for refreshing

        for (let snippet of this.plugin.allSnippets) {
            console.log(snippet);
            new Setting(this.existingEl)
                .setName(snippet.name)
                .setDesc(this.getDescription(snippet.type))
                .addButton((b: ButtonComponent) =>
                    b
                        .setIcon("pencil")
                        .setTooltip("Edit this Snippet")
                        .onClick(async () => {
                            await this.openModal(snippet.type, snippet);
                        })
                )
                .addButton((b: ButtonComponent) =>
                    b
                        .setIcon("duplicate-glyph")
                        .setTooltip("Copy this Snippet")
                        .onClick(async () => {
                            const copy = JSON.parse(JSON.stringify(snippet));
                            copy.name = generateSlug(2);
                            new Notice(
                                `Copied snippet '${snippet.name}' to '${copy.name}'`
                            );
                            await this.openModal(snippet.type, copy);
                        })
                )
                .addButton((b: ButtonComponent) =>
                    b
                        .setIcon("trash")
                        .setTooltip("Delete this Snippet")
                        .onClick(async () => {
                            await this.plugin.removeSnippet(snippet);
                            this.listExistingSnippets();
                        })
                );
        }
    }

    getDescription(type: string): string {
        // Some day --- more types.
        return "simple checkboxes";
    }

    async openModal(type: string, snippet: SnippetConfig): Promise<void> {
        // Some day --- more types.
        if (type === DEFAULT_TASK_SNIPPET_SETTINGS.type) {
            const taskCfg = await openCreateCheckboxModal(
                this.app,
                snippet as TaskSnippetConfig,
                this.plugin.snippetor
            );
            console.debug("Snippetor: modal closed with %o", taskCfg);
            await this.plugin.setSnippet(taskCfg);
            this.listExistingSnippets();
        }
    }

    isLightMode(): boolean {
        return document.body.hasClass("theme-light");
    }
}
