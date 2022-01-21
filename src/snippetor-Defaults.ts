import type {
    SnippetorSettings,
    TaskSettings,
    TaskSnippetConfig,
} from "./@types";

export const SAVE_ICON = `<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="save" class="svg-inline--fa fa-save fa-w-14" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M433.941 129.941l-83.882-83.882A48 48 0 0 0 316.118 32H48C21.49 32 0 53.49 0 80v352c0 26.51 21.49 48 48 48h352c26.51 0 48-21.49 48-48V163.882a48 48 0 0 0-14.059-33.941zM224 416c-35.346 0-64-28.654-64-64 0-35.346 28.654-64 64-64s64 28.654 64 64c0 35.346-28.654 64-64 64zm96-304.52V212c0 6.627-5.373 12-12 12H76c-6.627 0-12-5.373-12-12V108c0-6.627 5.373-12 12-12h228.52c3.183 0 6.235 1.264 8.485 3.515l3.48 3.48A11.996 11.996 0 0 1 320 111.48z"></path></svg>`;
export const SAVE = "snippetor-save";

export const MAGIC_WAND =
    '<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="magic" class="svg-inline--fa fa-magic fa-w-16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M224 96l16-32 32-16-32-16-16-32-16 32-32 16 32 16 16 32zM80 160l26.66-53.33L160 80l-53.34-26.67L80 0 53.34 53.33 0 80l53.34 26.67L80 160zm352 128l-26.66 53.33L352 368l53.34 26.67L432 448l26.66-53.33L512 368l-53.34-26.67L432 288zm70.62-193.77L417.77 9.38C411.53 3.12 403.34 0 395.15 0c-8.19 0-16.38 3.12-22.63 9.38L9.38 372.52c-12.5 12.5-12.5 32.76 0 45.25l84.85 84.85c6.25 6.25 14.44 9.37 22.62 9.37 8.19 0 16.38-3.12 22.63-9.37l363.14-363.15c12.5-12.48 12.5-32.75 0-45.24zM359.45 203.46l-50.91-50.91 86.6-86.6 50.91 50.91-86.6 86.6z"></path></svg>';
export const MAKE_IT_SO = "snippetor-gen";

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
