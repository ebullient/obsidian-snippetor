import type { SnippitorSettings, TaskSettings, TaskSnippetSettings } from "./@types";

export const DEFAULT_SETTINGS: SnippitorSettings = {
    snippets: new Map(),
};

export const DEFAULT_TASK_SNIPPET_SETTINGS: TaskSnippetSettings = {
    clearThemeBackground: false,
    taskSettings: [],
    name: "",
    type: "simple-task"
}

export const DEFAULT_TASK_SETTINGS: TaskSettings = {
    data: "",
    taskColor: "",
    colorText: false,
    strkethrough: false,
};
