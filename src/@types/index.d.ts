
export interface SnippetorSettings {
    snippets: Record<string, SnippetConfig>;
}

export interface SnippetConfig {
    version: string;
    name: string;
    id: string;
    type: string;
    cssFontImport?: string;
}

export interface TaskSnippetConfig extends SnippetConfig {
    taskSettings: TaskSettings[];
    baseFontSize: number;
    borderRadius?: number;
    hideColorPicker?: boolean;
    styleUncheckedTask?: boolean;
    uncheckedTask?: TaskSettings;
}

export interface TaskSettings {
    data: string;
    unchecked?: boolean;
    checkbox: CheckboxSettings;
    li: TaskListItemSettings;
    cache?: {
        // not persisted
        i: number;
        expanded?: boolean;
        textEl?: HTMLSpanElement;
        itemEl?: HTMLLIElement;
        checkboxEl?: HTMLInputElement;
        dataEl?: HTMLInputElement;
    };
}

export interface CheckboxSettings extends ColoredElement, FormattedElement {
    hideBorder?: boolean;
    readModeData?: string;
    preventClick?: boolean;
    left?: number;
    top?: number;
}

export interface TaskListItemSettings extends ColoredElement, FormattedElement {
    syncTaskColor?: boolean;
    syncTaskFont?: boolean;
}

export interface ColoredElement {
    lightMode: ColorSettings;
    darkMode: ColorSettings;
}

export interface ColorSettings {
    foreground?: string;
    background?: string;
}
export interface FormattedElement {
    format?: TextSettings;
}

export interface TextSettings {
    bold?: boolean;
    italics?: boolean;
    font?: string;
    fontSize?: number;
    fontWeight?: number;
    strikethrough?: boolean;
}

export interface ConstructedElements {
    content?: HTMLElement;
    list?: HTMLUListElement;
    defaultFontSize?: number;
}

export interface OldTaskSettings extends TaskSettings {
    clearThemeBackground?: boolean /* deprecated */;
    reader?: string /* deprecated */;
    taskColorLight?: string /* deprecated */;
    taskColorDark?: string /* deprecated */;
    bgColorLight?: string /* deprecated */;
    bgColorDark?: string /* deprecated */;
    applyTextColor?: boolean /* deprecated */;
    applyTextBgColor?: boolean /* deprecated */;
    strikethrough?: boolean /* deprecated */;
    hideBorder?: boolean /* deprecated */;
    fontSize?: number /* deprecated */;
}

export interface FolderConfig extends ColoredElement {
    target: string;
    font?: string;
    fontSize?: number;
    content?: string;
    cache: {
        // not persisted
        expanded?: boolean;
        folderEl: HTMLDivElement;
        titleEl: HTMLDivElement;
    };
}
export interface FolderSnippetConfig extends SnippetConfig {
    default: FolderConfig;
    folders: FolderConfig[];
    borderRadius: number;
    hideCollapse: boolean;
    folderIcon: boolean;
    hideScrollbar: boolean;
    hideTypes: boolean;
    hoverDecoration: boolean;
    relationshipLines: boolean;
}

declare module "obsidian" {
    interface App {
        customCss: {
            getSnippetPath(file?: string): string;
            readSnippets(): Promise<void>;
        };
        plugins: {
            plugins: {
                "obsidian-task-collector"?: {
                    api?: {
                        getCompletedTaskValues(): string;
                        getIncompleteTaskValues(): string;
                    };
                    taskCollector?: {
                        settings?: {
                            supportCanceledTasks: boolean;
                            incompleteTaskValues: string;
                            onlyLowercaseX: boolean;
                        };
                    };
                };
            };
        };
    }
}
