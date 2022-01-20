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
    alias?: string;
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
