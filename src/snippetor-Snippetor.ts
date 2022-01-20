import { App } from "obsidian";
import { SnippetorSettings } from "./@types";

export class Snippetor {
    settings: SnippetorSettings;

    constructor(private app: App) {
    }

    updateSettings(settings: SnippetorSettings): void {
        this.settings = settings;
    }
}
