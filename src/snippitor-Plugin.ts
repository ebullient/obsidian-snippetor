import { Plugin } from "obsidian";
import { SnippetConfig, SnippitorSettings } from "./@types";
import { DEFAULT_SETTINGS } from "./snippitor-Defaults";
import { SnippitorSettingsTab } from "./snippitor-SettingsTab";
import { Snippitor } from "./snippitor-Snippitor";

export class SnippitorPlugin extends Plugin {
    settings: SnippitorSettings;
    snippitor: Snippitor;

    async onload(): Promise<void> {
        this.snippitor = new Snippitor(this.app);
        await this.loadSettings();
        console.debug(
            "loaded Snippitor %s: %o",
            this.manifest.version,
            this.settings
        );
        this.addSettingTab(new SnippitorSettingsTab(this.app, this));
    }

    onunload(): void {
        console.debug("unloading Snippitor");
    }

    async loadSettings(): Promise<void> {
        const options = await this.loadData();
        this.settings = Object.assign({}, DEFAULT_SETTINGS, options);
        this.snippitor.updateSettings(this.settings);
    }

    async saveSettings(): Promise<void> {
        console.debug("Snippitor: saving settings");
        await this.saveData(this.settings);
        this.snippitor.updateSettings(this.settings);
    }

    async removeSnippet(snippetCfg: SnippetConfig): Promise<void> {
        console.log("Removing %o", snippetCfg);
        delete this.settings.snippets[snippetCfg.name];
        return this.saveSettings();
    }

    async setSnippet(snippetCfg: SnippetConfig): Promise<void> {
        console.log("Updating %o with %o", this.settings, snippetCfg);
        this.settings.snippets[snippetCfg.name] = snippetCfg;
        return this.saveSettings();
    }

    get allSnippets() {
        return Object.values(this.settings.snippets);
    }
}
