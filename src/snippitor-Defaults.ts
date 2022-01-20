import type {
    SnippitorSettings,
    TaskSettings,
    TaskSnippetConfig,
} from "./@types";

export const DEFAULT_SETTINGS: SnippitorSettings = {
    snippets: {},
};

export const DEFAULT_TASK_SNIPPET_SETTINGS: TaskSnippetConfig = {
    name: "",
    type: "simple-task",
    clearThemeBackground: false,
    taskSettings: [
        {
            data: "x",
            taskColor: "",
            applyTextColor: false,
            strkethrough: false,
        },
        {
            data: ">",
            taskColor: "#3490b2",
            applyTextColor: true,
            strkethrough: false,
        },
        {
            data: "-",
            taskColor: "#666666",
            applyTextColor: true,
            strkethrough: true,
        },
    ],
};

export const DEFAULT_TASK_SETTINGS: TaskSettings = {
    data: "",
    taskColor: "",
    applyTextColor: false,
    strkethrough: false,
};
