import { App } from "obsidian";
import { SnippitorSettings } from "./@types";

export class Snippitor {
    settings: SnippitorSettings;

    constructor(private app: App) {
        this.app = app;
    }

    updateSettings(settings: SnippitorSettings): void {
        this.settings = settings;
    }
}
