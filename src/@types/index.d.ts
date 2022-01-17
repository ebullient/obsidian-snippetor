export interface PluginSettings {}

export interface SnippitorSettings {
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
