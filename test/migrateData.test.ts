import { App } from "obsidian";
import {
    OldTaskSettings,
    TaskSettings,
    TaskSnippetConfig,
} from "../src/@types";
import { DEFAULT_TASK_SNIPPET_SETTINGS } from "../src/snippetor-Defaults";
import { Snippetor } from "../src/snippetor-Snippetor";

jest.mock("obsidian", () => ({
    App: jest.fn().mockImplementation(),
}));

const snippetor = new Snippetor(new App());

test("Migrate data, unchecked, foreground", () => {
    const initial: Partial<OldTaskSettings> = {
        data: "=",
        unchecked: true,
        taskColorLight: "fgLight",
        taskColorDark: "fgDark",
    };

    const expected: TaskSettings = {
        data: "=",
        unchecked: true,
        checkbox: {
            lightMode: {
                foreground: "fgLight",
            },
            darkMode: {
                foreground: "fgDark",
            },
        },
        li: {
            lightMode: {},
            darkMode: {},
        },
    };

    const actual = JSON.parse(JSON.stringify(initial));
    snippetor.initTaskSettings(undefined, actual);
});

test("Migrate foreground, applyToText", () => {
    const initial: Partial<OldTaskSettings> = {
        data: "=",
        taskColorLight: "fgLight",
        taskColorDark: "fgDark",
        applyTextColor: true,
    };

    const expected: TaskSettings = {
        data: "=",
        cache: {},
        checkbox: {
            lightMode: {
                foreground: "fgLight",
            },
            darkMode: {
                foreground: "fgDark",
            },
        },
        li: {
            lightMode: {},
            darkMode: {},
            syncTaskColor: true,
        },
    };

    const actual = JSON.parse(JSON.stringify(initial));
    snippetor.initTaskSettings(undefined, actual);
});

test("Migrate background, strikethrough, hideBorder, fontSize", () => {
    const initial: Partial<OldTaskSettings> = {
        data: "=",
        bgColorLight: "bgLight",
        bgColorDark: "bgDark",
        hideBorder: true,
        strikethrough: true,
        fontSize: 3,
    };

    const expected: TaskSettings = {
        data: "=",
        cache: {},
        checkbox: {
            lightMode: {
                background: "bgLight",
            },
            darkMode: {
                background: "bgDark",
            },
            hideBorder: true,
            format: {
                fontSize: 3,
            },
        },
        li: {
            lightMode: {},
            darkMode: {},
            format: {
                strikethrough: true,
            },
        },
    };

    const actual = JSON.parse(JSON.stringify(initial));
    snippetor.initTaskSettings(undefined, actual);
});

test("Migrate background, applyToText, reader", () => {
    const initial: Partial<OldTaskSettings> = {
        data: "=",
        bgColorLight: "bgLight",
        bgColorDark: "bgDark",
        applyTextColor: true,
        applyTextBgColor: true,
        reader: "1",
    };

    const expected: TaskSettings = {
        data: "=",
        cache: {},
        checkbox: {
            lightMode: {
                background: "bgLight",
            },
            darkMode: {
                background: "bgDark",
            },
            readModeData: "1",
        },
        li: {
            lightMode: {},
            darkMode: {},
            syncTaskColor: true,
        },
    };

    const actual = JSON.parse(JSON.stringify(initial));
    snippetor.initTaskSettings(undefined, actual);
    expect(actual).toEqual(expected);
});

test("Mammoth", () => {
    const initial = {
        name: "name",
        type: DEFAULT_TASK_SNIPPET_SETTINGS.type,
        uncheckedTask: {
            data: " ",
            unchecked: true,
            taskColorLight: "#9b11c1",
            taskColorDark: "#b6ed78",
            fontSize: 12,
        },
        taskSettings: [
            {
                data: ">",
                taskColorLight: "#9b11c1",
                taskColorDark: "#b6ed78",
                strikethrough: true,
            },
            {
                data: "?",
                taskColorLight: "#a5260d",
                taskColorDark: "#a9ff91",
                applyTextColor: true,
            },
            {
                data: "!",
                taskColorLight: "#060e6b",
                taskColorDark: "#d3b936",
                hideBorder: true,
            },
            {
                data: "i",
                taskColorLight: "#a82906",
                taskColorDark: "#a5f477",
                applyTextBgColor: true,
                bgColorDark: "#a05454",
            },
            {
                data: "-",
                taskColorLight: "#0c6d00",
                taskColorDark: "#d4f9a7",
                reader: "🌸",
                hideBorder: true,
                fontSize: 16,
            },
            {
                data: "x",
                taskColorLight: "#0c5e7a",
                taskColorDark: "#a0ffd1",
            },
            {
                data: "X",
                taskColorLight: "#b55e0c",
                taskColorDark: "#b37ae8",
            },
        ]
    }

    const expected: TaskSnippetConfig = {
        version: "0.1.7",
        name: "name",
        type: DEFAULT_TASK_SNIPPET_SETTINGS.type,
        baseFontSize: 14,
        uncheckedTask: {
            data: " ",
            unchecked: true,
            cache: {},
            checkbox: {
                lightMode: {
                    foreground: "#9b11c1"
                },
                darkMode: {
                    foreground: "#b6ed78"
                },
                format: {
                    fontSize: 12
                }
            },
            li: {
                lightMode: {},
                darkMode: {},
            }
        },
        taskSettings: [
        {
            data: ">",
            cache: {},
            li: {
                lightMode: {},
                darkMode: {},
                format: {
                    strikethrough: true,
                },
            },
            checkbox: {
                lightMode: {
                    foreground: "#9b11c1",
                },
                darkMode: {
                    foreground: "#b6ed78",
                },
            },
        },
        {
            data: "?",
            cache: {},
            checkbox: {
                lightMode: {
                    foreground: "#a5260d",
                },
                darkMode: {
                    foreground: "#a9ff91",
                },
            },
            li: {
                lightMode: {},
                darkMode: {},
                syncTaskColor: true,
            },
        },
        {
            data: "!",
            cache: {},
            checkbox: {
                lightMode: {
                    foreground: "#060e6b",
                },
                darkMode: {
                    foreground: "#d3b936",
                },
                hideBorder: true,
            },
            li: {
                lightMode: {},
                darkMode: {},
            },
        },
        {
            data: "i",
            cache: {},
            checkbox: {
                lightMode: {
                    foreground: "#a82906",
                },
                darkMode: {
                    foreground: "#a5f477",
                    background: "#a05454",
                },
            },
            li: {
                lightMode: {},
                darkMode: {},
                syncTaskColor: true,
            },
        },
        {
            data: "-",
            cache: {},
            checkbox: {
                lightMode: {
                    foreground: "#0c6d00",
                },
                darkMode: {
                    foreground: "#d4f9a7",
                },
                readModeData: "🌸",
                hideBorder: true,
                format: {
                    fontSize: 16,
                },
            },
            li: {
                lightMode: {},
                darkMode: {},
            },
        },
        {
            data: "x",
            cache: {},
            checkbox: {
                lightMode: {
                    foreground: "#0c5e7a",
                },
                darkMode: {
                    foreground: "#a0ffd1",
                },
            },
            li: {
                lightMode: {},
                darkMode: {},
            },
        },
        {
            data: "X",
            cache: {},
            checkbox: {
                lightMode: {
                    foreground: "#b55e0c",
                },
                darkMode: {
                    foreground: "#b37ae8",
                },
            },
            li: {
                lightMode: {},
                darkMode: {},
            },
        },
    ]};

    const actual = JSON.parse(JSON.stringify(initial));
    snippetor.initConfig(actual as Partial<TaskSnippetConfig>);
    expect(actual).toEqual(expected);
});
