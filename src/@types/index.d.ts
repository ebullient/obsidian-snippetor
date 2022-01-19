export interface SnippitorSettings {
    snippets: Map<string, Snippet>;
}

export interface Snippet {
    name: string;
    type: string;
}

export interface TaskSnippetSettings extends Snippet {
    clearThemeBackground: boolean;
    taskSettings: TaskSettings[];
}

export interface TaskSettings {
    data: string;
    taskColor: string;
    colorText: boolean;
    strkethrough: boolean;
}

export interface ConstructedElements {
    tasks: HTMLInputElement[];
    items: HTMLLIElement[];
}
