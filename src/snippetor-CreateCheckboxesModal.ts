import {
    App,
    ButtonComponent,
    ExtraButtonComponent,
    Modal,
    Setting,
    SliderComponent,
    ToggleComponent,
} from "obsidian";
import type {
    TaskSnippetConfig,
    TaskSettings,
    ConstructedElements,
} from "./@types";
import { generateSlug } from "random-word-slugs";
import { Snippetor } from "./snippetor-Snippetor";

export function openCreateCheckboxModal(
    app: App,
    taskSnippetCfg: TaskSnippetConfig,
    snippetor: Snippetor
): Promise<TaskSnippetConfig> {
    return new Promise((resolve) => {
        const modal = new CreateCheckboxesModal(app, taskSnippetCfg, snippetor);
        modal.onClose = () => {
            // do not persist the transient cache
            modal.cfg.taskSettings
                .filter((ts) => ts.cache)
                .forEach((ts) => delete ts.cache);
            // make sure a name is set
            if (!modal.cfg.name) {
                modal.cfg.name = generateSlug(2);
            }
            resolve(modal.cfg);
        };
        modal.open();
    });
}

class CreateCheckboxesModal extends Modal {
    cfg: TaskSnippetConfig;
    orig: TaskSnippetConfig;
    id: number;
    elements: ConstructedElements;
    snippetor: Snippetor;

    constructor(
        app: App,
        taskSnippetCfg: TaskSnippetConfig,
        snippetor: Snippetor
    ) {
        super(app);
        this.snippetor = snippetor;
        this.containerEl.id = "snippetor-checkboxes-modal";
        this.cfg = taskSnippetCfg || snippetor.createNewTaskSnippetCfg();

        this.orig = JSON.parse(JSON.stringify(this.cfg)); // save original
        this.id = 0;

        this.elements = {
            tasks: [],
            items: [],
            data: [],
        };
    }

    get snapshot() {
        return this.orig;
    }

    onOpen(): void {
        this.titleEl.createSpan({ text: "Snippetor: Tasks" });

        const content = this.contentEl.createDiv(
            "snippetor-checkboxes markdown-preview-view"
        );
        this.elements.defaultColorSource = content; // just need a row, any row

        this.elements.canvas = content.createEl("canvas", {
            attr: {
                style: "display: none",
            },
        });

        new Setting(content)
            .setName("Name of generated snippet (filename)")
            .addText((text) => {
                text.setPlaceholder("trigger")
                    .setValue(this.cfg.name)
                    .onChange((value) => {
                        this.cfg.name = value;
                    });
            })
            .addButton((button) =>
                button
                    .setIcon("wand-glyph")
                    .setClass("generate-css")
                    .setTooltip("Generate CSS Snippet")
                    .onClick(async () => {
                        button.buttonEl.addClass("is-active");
                        button.disabled = true;
                        await this.snippetor.generateCss(this.cfg);
                        button.buttonEl.removeClass("is-active");
                        button.disabled = false;
                    })
            );

        content.createEl("h3", {
            text: "Custom Task Values",
        });

        this.elements.list = content.createEl("ul");
        this.showTaskRows();

        new Setting(content)
            .setClass("snippetor-create-task")
            .addButton((button: ButtonComponent) =>
                button
                    .setTooltip("Add a task type")
                    .setButtonText("+")
                    .onClick(() => {
                        const taskSettings =
                            this.snippetor.createNewTaskCfg("");
                        this.createTaskRow(taskSettings);
                        this.cfg.taskSettings.push(taskSettings);
                    })
            );

        content.createEl("h3", {
            text: "Additional settings",
        });

        new Setting(content)
            .setName("Suppress theme-defined background color")
            .setDesc(
                "Does theme styling show around your selected tasks? Your theme may provide a way to disable task styling (preferred). This might also work."
            )
            .addToggle((t) => {
                t.setValue(this.cfg.clearThemeBackground).onChange((v) => {
                    this.cfg.clearThemeBackground = v;
                    this.elements.tasks.forEach((t) =>
                        this.applyCommonSettingsToCheckbox(t)
                    );
                });
            });

        new Setting(content)
            .setName("Hide the color picker")
            .setDesc(
                "If you prefer working with the raw values (Hex, RGB, CSS variables, etc), enable this to hide the color picker and show a text box instead."
            )
            .addToggle((t) => {
                t.setValue(this.cfg.hideColorPicker).onChange((v) => {
                    const redraw = v != this.cfg.hideColorPicker;
                    this.cfg.hideColorPicker = v;
                    if (redraw) {
                        this.showTaskRows();
                    }
                });
            });
    }

    onClose(): void {
        this.contentEl.empty();
    }

    showTaskRows(): void {
        this.elements.tasks.length = 0;
        this.elements.items.length = 0;
        this.elements.data.length = 0;
        this.elements.list.empty();

        // Callback to re-draw the whole thing if light/dark mode is toggled.
        this.createHeaderRow(() => this.showTaskRows());

        this.cfg.taskSettings.forEach((ts) => {
            if (ts.cache === undefined) {
                ts.cache = {};
            }
            this.createTaskRow(ts);
        });
    }

    createHeaderRow(callback: () => void): void {
        const heading = this.elements.list.createEl("li", {
            cls: "task-list-item header",
        });
        const preview = heading.createSpan("snippetor-preview");
        const checkbox = preview.createEl("input", {
            cls: "task-list-item-checkbox",
            attr: {
                type: "checkbox",
            },
        });
        this.elements.defaultFontSize = Math.ceil(
            Number(getComputedStyle(checkbox).fontSize.replace("px", ""))
        );

        preview.createSpan({
            text: "Preview",
            cls: "example snippetor-heading",
        });
        heading.createSpan({
            text: "Settings",
            cls: "snippetor-settings snippetor-heading",
        });
        new ToggleComponent(heading)
            .setValue(this.isLightMode())
            .onChange(async (value) => {
                if (value) {
                    this.containerEl.addClass("theme-light");
                    this.containerEl.removeClass("theme-dark");
                } else {
                    this.containerEl.addClass("theme-dark");
                    this.containerEl.removeClass("theme-light");
                }
                return callback();
            })
            .toggleEl.addClass("theme-toggle");

        const actions = heading.createSpan("snippetor-li-actions");
        new ExtraButtonComponent(actions)
            .setIcon("reset")
            .onClick(() => {
                this.cfg = JSON.parse(JSON.stringify(this.snapshot)); // reset
                this.showTaskRows();
            })
            .extraSettingsEl.addClass("no-padding");
    }

    createTaskRow(taskSettings: TaskSettings): void {
        const li = this.elements.list.createEl("li");

        this.applySettingsToListItem(taskSettings, li);
        this.elements.items.push(li);

        const preview = li.createSpan("snippetor-preview");

        // Example: Checkbox -- attributes will be updated
        const checkbox = preview.createEl("input", {
            cls: "task-list-item-checkbox",
            attr: {
                type: "checkbox",
            },
        });
        this.applySettingsToCheckbox(taskSettings, checkbox);
        this.applyCommonSettingsToCheckbox(checkbox);
        this.elements.tasks.push(checkbox);

        // Example: Sample text -- attributes will be updated
        preview.createSpan({ text: "example", cls: "example" });

        // Settings..
        const settings = li.createDiv("snippetor-settings");
        this.showSettings(taskSettings, li, preview, checkbox, settings);

        // Twistie (moar settings!)
        const actions = li.createSpan("snippetor-li-actions");
        const extra = new ExtraButtonComponent(actions)
            .setIcon("down-chevron-glyph")
            .setTooltip("Show additional options")
            .onClick(() => {
                taskSettings.cache.expanded =
                    taskSettings.cache.expanded === undefined
                        ? true
                        : !taskSettings.cache.expanded;
                this.showSettings(
                    taskSettings,
                    li,
                    preview,
                    checkbox,
                    settings
                );
                if (taskSettings.cache.expanded) {
                    extra.extraSettingsEl.addClass("snippetor-extra-show");
                } else {
                    extra.extraSettingsEl.removeClass("snippetor-extra-show");
                }
            });

        // Remove
        new ExtraButtonComponent(actions)
            .setIcon("trash")
            .setTooltip("Delete this Task")
            .onClick(async () => {
                console.log("Delete %o", li);
                this.cfg.taskSettings.remove(taskSettings);
                this.showTaskRows();
            });
    }

    showSettings(
        taskSettings: TaskSettings,
        li: HTMLLIElement,
        previewSpan: HTMLSpanElement,
        checkbox: HTMLInputElement,
        settings: HTMLSpanElement
    ): void {
        const i = this.id++;
        settings.empty();
        this.showBasicSettings(
            taskSettings,
            li,
            previewSpan,
            checkbox,
            settings,
            i
        );
        if (taskSettings.cache.expanded) {
            this.showBackgroundSettings(
                taskSettings,
                li,
                checkbox,
                settings,
                i
            );
            this.showReaderValueSettings(
                taskSettings,
                li,
                checkbox,
                settings,
                i
            );
        }
    }

    showBasicSettings(
        taskSettings: TaskSettings,
        li: HTMLLIElement,
        previewSpan: HTMLSpanElement,
        checkbox: HTMLInputElement,
        parent: HTMLSpanElement,
        i: number
    ): void {
        const settings = parent.createSpan("snippetor-row");

        // Specify the task character
        const dataTask = settings.createEl("input", {
            cls: "snippetor-data-task",
            attr: {
                type: "text",
                name: "task-" + i,
                size: "1",
                value: taskSettings.data,
                title: "Task data",
            },
        });
        this.elements.data.push(dataTask);
        this.verifyDataValue(dataTask);
        dataTask.addEventListener(
            "input",
            () => {
                taskSettings.data = dataTask.value;
                this.applySettingsToListItem(taskSettings, li);
                this.applySettingsToCheckbox(taskSettings, checkbox);
                this.verifyDataValue(dataTask);
            },
            false
        );

        // the checkbox / symbol color
        const initial = this.getThemeColor(taskSettings);
        const colorGroup = settings.createSpan("snippetor-group");
        const taskColor = colorGroup.createEl("input", {
            cls: "snippetor-data-color-txt",
            attr: {
                name: "color-fg-" + i,
                value: initial,
                title: "Foreground color for the task: " + initial,
            },
        });
        if (this.cfg.hideColorPicker) {
            taskColor.setAttribute("type", "text");
            taskColor.setAttribute("size", "8");
        } else {
            taskColor.setAttribute("type", "color");
        }
        taskColor.addEventListener(
            "input",
            () => {
                this.setThemeColor(taskSettings, taskColor.value);
                this.applyColor(taskSettings, li, checkbox);
                taskColor.title =
                    "Foreground color for the task: " + taskColor.value;
            },
            false
        );

        // sync light/dark mode
        const colorSync = colorGroup.createSpan({
            text: "🌗",
            cls: "color-sync",
            attr: {
                name: "color-sync-" + i,
                "aria-label": `Copy value from ${
                    this.isLightMode() ? "dark" : "light"
                } mode`,
                style: "cursor: pointer",
            },
        });
        colorSync.addEventListener(
            "click",
            () => {
                if (this.isLightMode()) {
                    taskColor.value = taskSettings.taskColorLight;
                } else {
                    taskColor.value = taskSettings.taskColorDark;
                }
                this.setThemeColor(taskSettings, taskColor.value);
                this.applyColor(taskSettings, li, checkbox);
            },
            false
        );

        new ExtraButtonComponent(colorGroup)
            .setIcon("reset")
            .setTooltip("Reset foreground color to default")
            .onClick(async () => {
                if (!this.cfg.hideColorPicker) {
                    taskColor.value = this.getForegroundColor();
                }
                if (this.isLightMode()) {
                    delete taskSettings.taskColorLight;
                } else {
                    delete taskSettings.taskColorDark;
                }
                this.applyColor(taskSettings, li, checkbox);
            })
            .extraSettingsEl.addClass("no-padding");

        // should the color apply to the text, too?
        const colorTextGroup = settings.createSpan("snippetor-group");
        const colorText = colorTextGroup.createEl("input", {
            attr: {
                name: "text-color-" + i,
                type: "checkbox",
                value: taskSettings.applyTextColor,
            },
        });
        if (taskSettings.applyTextColor) {
            colorText.setAttribute("checked", "");
        }
        colorText.addEventListener(
            "click",
            () => {
                taskSettings.applyTextColor = colorText.checked;
                this.applyColor(taskSettings, li, checkbox);
            },
            false
        );
        colorTextGroup.createEl("label", {
            text: "color text",
            attr: { for: "text-color-" + i },
        });

        // strikethrough?
        const strikethroughGroup = settings.createSpan("snippetor-group");
        const strikethrough = strikethroughGroup.createEl("input", {
            attr: {
                name: "strikethrough-" + i,
                type: "checkbox",
            },
        });
        if (taskSettings.strikethrough) {
            strikethrough.setAttribute("checked", "");
        }
        strikethrough.addEventListener(
            "click",
            () => {
                taskSettings.strikethrough = strikethrough.checked;
                this.applyStrikethrough(taskSettings, previewSpan);
            },
            false
        );
        strikethroughGroup.createEl("label", {
            text: "strikethrough",
            attr: { for: "strikethrough-" + i },
        });
        this.applyStrikethrough(taskSettings, previewSpan);

        // border
        const borderGroup = settings.createSpan("snippetor-group");
        const hideBorder = borderGroup.createEl("input", {
            attr: {
                name: "border-" + i,
                type: "checkbox",
            },
        });
        if (taskSettings.hideBorder) {
            hideBorder.setAttribute("checked", "");
        }
        hideBorder.addEventListener(
            "click",
            () => {
                taskSettings.hideBorder = hideBorder.checked;
                this.applySettingsToCheckbox(taskSettings, checkbox);
            },
            false
        );
        borderGroup.createEl("label", {
            text: "hide border",
            attr: { for: "border-" + i },
        });
    }

    showBackgroundSettings(
        taskSettings: TaskSettings,
        li: HTMLLIElement,
        checkbox: HTMLInputElement,
        parent: HTMLSpanElement,
        i: number
    ): void {
        const settings = parent.createSpan("snippetor-row");

        const colorGroup = settings.createSpan("snippetor-group");
        colorGroup.createDiv({
            text: "Background: ",
            cls: "background-heading",
        });

        // the checkbox / symbol color
        const initial = this.getThemeBackgroundColor(taskSettings);
        const taskColor = colorGroup.createEl("input", {
            cls: "snippetor-data-color-txt",
            attr: {
                name: "color-bg-" + i,
                value: initial,
                title: "Background color for the task: " + initial,
            },
        });
        if (this.cfg.hideColorPicker) {
            taskColor.setAttribute("type", "text");
            taskColor.setAttribute("size", "8");
        } else {
            taskColor.setAttribute("type", "color");
        }
        taskColor.addEventListener(
            "input",
            () => {
                this.setThemeBackgroundColor(taskSettings, taskColor.value);
                this.applyColor(taskSettings, li, checkbox);
                taskColor.title =
                    "Background color for the task: " + taskColor.value;
            },
            false
        );

        // sync light/dark mode
        const colorSync = colorGroup.createSpan({
            text: "🌗",
            cls: "color-sync",
            attr: {
                name: "color-bg-sync-" + i,
                "aria-label": `Copy background color value from ${
                    this.isLightMode() ? "dark" : "light"
                } mode`,
                style: "cursor: pointer",
            },
        });
        colorSync.addEventListener(
            "click",
            () => {
                if (this.isLightMode()) {
                    if (taskSettings.bgColorDark) {
                        taskColor.value = taskSettings.bgColorDark;
                    }
                } else {
                    if (taskSettings.bgColorLight) {
                        taskColor.value = taskSettings.bgColorLight;
                    }
                }
                this.setThemeBackgroundColor(taskSettings, taskColor.value);
                this.applyColor(taskSettings, li, checkbox);
            },
            false
        );

        new ExtraButtonComponent(colorGroup)
            .setIcon("reset")
            .setTooltip("Reset background color to default")
            .onClick(async () => {
                if (!this.cfg.hideColorPicker) {
                    taskColor.value = this.getBackgroundColor();
                }
                if (this.isLightMode()) {
                    delete taskSettings.bgColorLight;
                } else {
                    delete taskSettings.bgColorDark;
                }
                this.applyColor(taskSettings, li, checkbox);
            })
            .extraSettingsEl.addClass("no-padding");

        // should the color apply to the text, too?
        const colorTextGroup = settings.createSpan("snippetor-group");
        const colorText = colorTextGroup.createEl("input", {
            attr: {
                name: "text-color-" + i,
                type: "checkbox",
                value: taskSettings.applyTextBgColor,
            },
        });
        if (taskSettings.applyTextBgColor) {
            colorText.setAttribute("checked", "");
        }
        colorText.addEventListener(
            "click",
            () => {
                taskSettings.applyTextBgColor = colorText.checked;
                this.applyColor(taskSettings, li, checkbox);
            },
            false
        );
        colorTextGroup.createEl("label", {
            text: "apply background to text",
            attr: { for: "text-color-" + i },
        });
    }

    showReaderValueSettings(
        taskSettings: TaskSettings,
        li: HTMLLIElement,
        checkbox: HTMLInputElement,
        parent: HTMLSpanElement,
        i: number
    ): void {
        const settings = parent.createSpan("snippetor-row reader");

        settings.createDiv({
            text: "Rendered as ",
            cls: "read-mode-heading",
        });

        // Specify the task character
        const readerTask = settings.createEl("input", {
            cls: "snippetor-data-task",
            attr: {
                type: "text",
                name: "task-reader-" + i,
                size: "1",
                value:
                    taskSettings.reader === undefined
                        ? taskSettings.data
                        : taskSettings.reader,
                title: "Display character for preview / reading mode",
            },
        });
        readerTask.addEventListener(
            "input",
            () => {
                taskSettings.reader = readerTask.value;
                this.applySettingsToListItem(taskSettings, li);
                this.applySettingsToCheckbox(taskSettings, checkbox);
            },
            false
        );

        const sizeGroup = settings.createSpan("snippetor-group");
        sizeGroup.createEl("label", {
            text: "size: ",
            attr: { for: "size-" + i },
        });
        const fontSize = new SliderComponent(sizeGroup)
            .setValue(
                taskSettings.fontSize === undefined
                    ? this.elements.defaultFontSize
                    : taskSettings.fontSize
            )
            .setLimits(6, 30, 1)
            .setDynamicTooltip()
            .onChange((v) => {
                console.log(v);
                taskSettings.fontSize = v;
                this.applySettingsToCheckbox(taskSettings, checkbox);
            });

        fontSize.sliderEl.id = "size-" + i;
        new ExtraButtonComponent(sizeGroup)
            .setIcon("reset")
            .setTooltip("Reset font size to default")
            .onClick(async () => {
                fontSize.setValue(this.elements.defaultFontSize);
                delete taskSettings.fontSize;
                this.applySettingsToCheckbox(taskSettings, checkbox);
            })
            .extraSettingsEl.addClass("no-padding");
    }

    applyColor(
        taskSettings: TaskSettings,
        li: HTMLLIElement,
        checkbox: HTMLInputElement
    ): void {
        this.applySettingsToCheckbox(taskSettings, checkbox);
        this.applySettingsToListItem(taskSettings, li);
    }

    applySettingsToListItem(
        taskSettings: TaskSettings,
        li: HTMLLIElement
    ): void {
        li.setAttr("data-task", taskSettings.data);
        li.className =
            "task-list-item" + (taskSettings.data == " " ? "" : " is-checked");

        this.setListItemColors(taskSettings, li);
    }

    applyStrikethrough(
        taskSettings: TaskSettings,
        preview: HTMLSpanElement
    ): void {
        if (taskSettings.strikethrough) {
            preview.style.textDecoration = "line-through";
        } else {
            preview.style.textDecoration = "none";
        }
    }

    applySettingsToCheckbox(
        taskSettings: TaskSettings,
        checkbox: HTMLInputElement
    ): void {
        checkbox.removeAttribute("data");
        checkbox.style.removeProperty("--snippetor-font-size");

        if (taskSettings.data !== " ") {
            const data = taskSettings.reader
                ? taskSettings.reader
                : taskSettings.data;
            checkbox.setAttribute("checked", "");
            checkbox.setAttribute("data", data);
        }
        if (taskSettings.fontSize) {
            checkbox.style.setProperty(
                "--snippetor-font-size",
                taskSettings.fontSize + "px"
            );
        } else {
            checkbox.style.setProperty(
                "--snippetor-font-size",
                this.elements.defaultFontSize + "px"
            );
        }
        this.setCheckboxColors(taskSettings, checkbox);
    }

    applyCommonSettingsToCheckbox(checkbox: HTMLInputElement): void {
        checkbox.style.removeProperty("background-color");
        if (this.cfg.clearThemeBackground) {
            // doing this the hard way because we have to override at least one !important in a theme (minimal)
            const style = checkbox.getAttribute("style");
            checkbox.setAttribute(
                "style",
                style + " background-color: unset !important;"
            );
        }
    }

    isLightMode(): boolean {
        return (
            this.containerEl.hasClass("theme-light") ||
            (!this.containerEl.hasClass("theme-dark") &&
                document.body.hasClass("theme-light"))
        );
    }

    getForegroundColor(): string {
        const ctx = this.elements.canvas.getContext("2d");
        ctx.fillStyle = getComputedStyle(
            this.elements.defaultColorSource
        ).color;
        return ctx.fillStyle;
    }

    getBackgroundColor(): string {
        const ctx = this.elements.canvas.getContext("2d");
        ctx.fillStyle = getComputedStyle(
            this.elements.defaultColorSource
        ).backgroundColor;
        return ctx.fillStyle;
    }

    getThemeColor(taskSettings: TaskSettings): string {
        if (this.isLightMode()) {
            return taskSettings.taskColorLight;
        } else {
            return taskSettings.taskColorDark;
        }
    }

    setThemeColor(taskSettings: TaskSettings, color: string) {
        if (this.isLightMode()) {
            taskSettings.taskColorLight = color;
        } else {
            taskSettings.taskColorDark = color;
        }
    }

    getThemeBackgroundColor(taskSettings: TaskSettings): string {
        if (this.isLightMode()) {
            return taskSettings.bgColorLight === undefined
                ? this.getBackgroundColor()
                : taskSettings.bgColorLight;
        }
        return taskSettings.bgColorDark === undefined
            ? this.getBackgroundColor()
            : taskSettings.bgColorDark;
    }

    setThemeBackgroundColor(taskSettings: TaskSettings, color: string) {
        if (this.isLightMode()) {
            taskSettings.bgColorLight = color;
        } else {
            taskSettings.bgColorDark = color;
        }
    }

    setListItemColors(taskSettings: TaskSettings, li: HTMLLIElement): void {
        const taskColor = this.getThemeColor(taskSettings);
        const bgColor = this.getThemeBackgroundColor(taskSettings);
        if (taskSettings.applyTextColor && taskColor && taskColor.length > 0) {
            li.style.color = taskColor;
        } else {
            li.style.removeProperty("color");
        }
        if (taskSettings.applyTextBgColor && bgColor && bgColor.length > 0) {
            li.style.backgroundColor = bgColor;
        } else {
            li.style.removeProperty("background-color");
        }
    }

    setCheckboxColors(
        taskSettings: TaskSettings,
        checkbox: HTMLInputElement
    ): void {
        const fgColor = this.getThemeColor(taskSettings);
        const bgColor = this.getThemeBackgroundColor(taskSettings);
        if (fgColor && fgColor.length > 0) {
            checkbox.style.borderColor = fgColor;
            checkbox.style.color = fgColor;
            checkbox.setAttribute("color", fgColor);
        } else {
            checkbox.style.removeProperty("border-color");
            checkbox.style.removeProperty("color");
            checkbox.removeAttribute("color");
        }
        if (bgColor && bgColor.length > 0) {
            checkbox.style.backgroundColor = bgColor;
        } else {
            checkbox.style.removeProperty("background-color");
        }
        if (taskSettings.hideBorder) {
            checkbox.style.borderColor = "transparent";
        }
    }

    verifyDataValue(input: HTMLInputElement) {
        if (
            this.cfg.taskSettings.filter((t) => input.value === t.data).length >
            1
        ) {
            input.style.borderColor = "var(--background-modifier-error)";
            input.setAttribute(
                "aria-label",
                "Another task uses the same value"
            );
            input.setAttribute("conflict", input.value);
            this.elements.data.forEach((e) => {
                if (e.value === input.value && !e.hasAttribute("conflict")) {
                    this.verifyDataValue(e);
                }
            });
        } else {
            input.style.removeProperty("border-color");
            input.removeAttribute("aria-label");
            const conflict = input.getAttribute("conflict");
            if (conflict) {
                input.removeAttribute("conflict");
                this.elements.data.forEach((e) => {
                    if (e.value === conflict) {
                        this.verifyDataValue(e);
                    }
                });
            }
        }
    }
}
