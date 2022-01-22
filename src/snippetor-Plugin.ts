import { Plugin } from "obsidian";
import { SnippetConfig, SnippetorSettings } from "./@types";
import { DEFAULT_SETTINGS } from "./snippetor-Defaults";
import { SnippetorSettingsTab } from "./snippetor-SettingsTab";
import { Snippetor as Snippetor } from "./snippetor-Snippetor";

export class SnippetorPlugin extends Plugin {
    settings: SnippetorSettings;
    snippetor: Snippetor;

    async onload(): Promise<void> {
        this.snippetor = new Snippetor(this.app);
        await this.loadSettings();
        console.debug(
            "loaded Snippetor %s: %o",
            this.manifest.version,
            this.settings
        );
        this.addSettingTab(new SnippetorSettingsTab(this.app, this));
    }

    onunload(): void {
        console.debug("unloading Snippetor");
    }

    async loadSettings(): Promise<void> {
        const options = await this.loadData();
        this.settings = Object.assign({}, DEFAULT_SETTINGS, options);
    }

    async saveSettings(): Promise<void> {
        console.debug("Snippetor: saving settings");
        await this.saveData(this.settings);
    }

    async removeSnippet(snippetCfg: SnippetConfig): Promise<void> {
        console.log("Removing %o", snippetCfg);
        delete this.settings.snippets[snippetCfg.name];
        return this.saveSettings().then(() =>
            this.snippetor.deleteSnippet(snippetCfg)
        );
    }

    async setSnippet(snippetCfg: SnippetConfig): Promise<void> {
        console.log("Updating %o with %o", this.settings, snippetCfg);
        this.settings.snippets[snippetCfg.name] = snippetCfg;
        return this.saveSettings();
    }

    get allSnippets(): SnippetConfig[] {
        return Object.values(this.settings.snippets);
    }
}
