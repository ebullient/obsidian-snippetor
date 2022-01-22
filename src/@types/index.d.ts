export interface SnippetorSettings {
    snippets: Record<string, SnippetConfig>;
}

export interface SnippetConfig {
    name: string;
    type: string;
}

export interface TaskSnippetConfig extends SnippetConfig {
    taskSettings: TaskSettings[];
    hideColorPicker?: boolean;
    clearThemeBackground?: boolean;
}

export interface TaskSettings {
    data: string;
    reader?: string;
    taskColorLight?: string;
    taskColorDark?: string;
    bgColorLight?: string;
    bgColorDark?: string;
    applyTextColor?: boolean;
    applyTextBgColor?: boolean;
    strikethrough?: boolean;
    hideBorder?: boolean;
    fontSize?: number;
    cache?: {
        expanded?: boolean;
    };
}

export interface ConstructedElements {
    tasks: HTMLInputElement[];
    items: HTMLLIElement[];
    data: HTMLInputElement[];
    list?: HTMLUListElement;
    canvas?: HTMLCanvasElement;
    defaultColorSource?: HTMLElement;
    defaultFontSize?: number;
}

declare module "obsidian" {
    interface App {
        customCss: {
            snippets: string[];
            getSnippetPath(file?: string): string;
            readCssFolders(): Promise<void>;
        };
        plugins: {
            plugins: {
                "obsidian-task-collector"?: {
                    taskCollector?: {
                        settings?: {
                            supportCanceledTasks: boolean;
                            incompleteTaskValues: string;
                        };
                    };
                };
            };
        };
    }
}
