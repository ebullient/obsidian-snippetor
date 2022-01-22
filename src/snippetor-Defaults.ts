import type {
    SnippetorSettings,
    TaskSettings,
    TaskSnippetConfig,
} from "./@types";

export const DEFAULT_SETTINGS: SnippetorSettings = {
    snippets: {},
};

export const DEFAULT_TASK_SNIPPET_SETTINGS: TaskSnippetConfig = {
    name: "",
    type: "simple-task",
    taskSettings: [],
};

export const DEFAULT_TASK_SETTINGS: TaskSettings = {
    data: "",
};
