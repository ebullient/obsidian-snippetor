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
    clearThemeBackground: false,
    taskSettings: [
        {
            data: "x",
            applyTextColor: false,
            strkethrough: false,
        },
        {
            data: ">",
            taskColorLight: "#1b9d9b",
            taskColorDark: "#3490b2",
            applyTextColor: true,
            strkethrough: false,
        },
        {
            data: "-",
            taskColorLight: "#666666",
            applyTextColor: true,
            strkethrough: true,
        },
    ],
};

export const DEFAULT_TASK_SETTINGS: TaskSettings = {
    data: "",
};
