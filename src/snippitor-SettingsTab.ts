import { App, ButtonComponent, PluginSettingTab, Setting } from "obsidian";
import { SnippitorSettings } from "./@types";
import SnippitorPlugin from "./main";
import { CreateCheckboxesModal } from "./snippitor-SettingsCreateCheckboxes";

export class SnippitorSettingsTab extends PluginSettingTab {
    plugin: SnippitorPlugin;

    constructor(app: App, plugin: SnippitorPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        this.containerEl.empty();
        this.containerEl.createEl("h1", { text: "Snippitor" });

        const tempSettings: SnippitorSettings = Object.assign(
            this.plugin.settings
        );

        const selector = {
            type: "checkboxes",
        };
        new Setting(this.containerEl)
            .setClass("snippitor-create-snippet")
            .setName("Create a new CSS snippet (select type)")
            .addDropdown((d) => {
                d.addOption("checkboxes", "Custom checkboxes");
                d.setValue("checkboxes");
                d.onChange((v) => {
                    console.log("Which type %o", v);
                    selector.type = v;
                });
            })
            .addButton((button: ButtonComponent) =>
                button
                    .setTooltip("Add Calendar")
                    .setButtonText("+")
                    .onClick(() => {
                        console.log("Open Modal to create %o", selector.type);
                        if (selector.type === "checkboxes") {
                            const modal = new CreateCheckboxesModal(this.app);
                            modal.onClose = () => {
                                console.log("modal closed");
                            };
                            modal.open();
                        }
                    })
            );
    }
}
