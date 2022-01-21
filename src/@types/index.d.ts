export interface SnippetorSettings {
    snippets: Record<string, SnippetConfig>;
}

export interface SnippetConfig {
    name: string;
    type: string;
}

export interface TaskSnippetConfig extends SnippetConfig {
    clearThemeBackground: boolean;
    taskSettings: TaskSettings[];
}

export interface TaskSettings {
    data: string;
    reader?: string;
    taskColorLight?: string;
    taskColorDark?: string;
    applyTextColor?: boolean;
    strkethrough?: boolean;
}

export interface ConstructedElements {
    tasks: HTMLInputElement[];
    items: HTMLLIElement[];
    data: HTMLInputElement[];
}

declare module "obsidian" {
    interface App {
        customCss: {
            snippets: string[];
            getSnippetPath(file?: string): string;
        };
        plugins: {
            enabledPlugins: Set<string>;
            plugins: {
                [id: string]: any;
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
