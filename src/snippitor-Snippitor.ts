import { App } from "obsidian";
import { SnippitorSettings } from "./snippitor-Settings";

export class Snippitor {
    settings: SnippitorSettings;

    constructor(private app: App) {
        this.app = app;
    }

    updateSettings(settings: any) {
        this.settings = settings;
    }
}
