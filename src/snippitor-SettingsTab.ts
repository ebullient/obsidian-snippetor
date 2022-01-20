import {
    App,
    ButtonComponent,
    ExtraButtonComponent,
    PluginSettingTab,
    Setting,
} from "obsidian";
import { SnippetConfig, SnippitorSettings, TaskSnippetConfig } from "./@types";
import SnippitorPlugin from "./main";
import { openCreateCheckboxModal } from "./snippitor-CreateCheckboxesModal";

export class SnippitorSettingsTab extends PluginSettingTab {
    plugin: SnippitorPlugin;
    existingEl: HTMLDivElement;

    constructor(app: App, plugin: SnippitorPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        this.containerEl.empty();
        this.containerEl.addClass("snippitor-plugin-settings");

        this.containerEl.createEl("h2", { text: "Snippitor" });
        this.buildNewSnippet();

        this.existingEl = this.containerEl.createDiv();
        this.listExistingSnippets();
    }

    buildNewSnippet() {
        const selector = {
            type: "simple-task",
        };
        new Setting(this.containerEl)
            .setClass("snippitor-create-snippet")
            .setName("Create a new CSS snippet (select type)")
            .addDropdown((d) => {
                d.addOption("simple-task", "Custom checkboxes");
                d.setValue("simple-task");
                d.onChange((v) => {
                    console.log("Which type %o", v);
                    selector.type = v;
                });
            })
            .addButton((button: ButtonComponent) =>
                button
                    .setTooltip("Create a Snippet")
                    .setButtonText("+")
                    .onClick(async () => {
                        console.log("Create new snippet");
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
                .addExtraButton((b: ExtraButtonComponent) =>
                    b
                        .setIcon("pencil")
                        .setTooltip("Edit this Snippet")
                        .onClick(async () => {
                            console.log("Editing snippet %o", snippet);
                            await this.openModal(snippet.type, snippet);
                        })
                )
                .addButton((b: ButtonComponent) =>
                    b
                        .setIcon("trash")
                        .setTooltip("Delete this Snippet")
                        .onClick(async () => {
                            console.log("Delete %o", snippet);
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
        if (type === "simple-task") {
            const taskCfg = await openCreateCheckboxModal(
                this.app,
                snippet as TaskSnippetConfig
            );
            console.debug("Snippitor: modal closed with %o", taskCfg);
            await this.plugin.setSnippet(taskCfg);
            this.listExistingSnippets();
        }
    }
}
