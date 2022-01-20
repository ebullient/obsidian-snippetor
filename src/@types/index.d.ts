export interface SnippitorSettings {
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
    taskColor: string;
    applyTextColor: boolean;
    strkethrough: boolean;
}

export interface ConstructedElements {
    tasks: HTMLInputElement[];
    items: HTMLLIElement[];
}
