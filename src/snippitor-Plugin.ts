import { Plugin, TFile, View, WorkspaceLeaf } from "obsidian";
import { SnippitorSettings } from "./@types";
import { SnippitorSettingsTab } from "./snippitor-SettingsTab";
import { Snippitor } from "./snippitor-Snippitor";

export const DEFAULT_SETTINGS: SnippitorSettings = {};

export class SnippitorPlugin extends Plugin {
    settings: SnippitorSettings;
    snippitor: Snippitor;

    async onload(): Promise<void> {
        this.snippitor = new Snippitor(this.app);
        await this.loadSettings();
        console.debug(
            "loading Snippitor %s: %o",
            this.manifest.version,
            this.settings
        );
        this.addSettingTab(new SnippitorSettingsTab(this.app, this));
    }

    onunload(): void {
        console.debug("unloading Snippitor");
    }

    async loadSettings(): Promise<void> {
        this.settings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            await this.loadData()
        );
        this.snippitor.updateSettings(this.settings);
    }

    async saveSettings(): Promise<void> {
        await this.saveData(this.settings);
        this.snippitor.updateSettings(this.settings);
    }
}
