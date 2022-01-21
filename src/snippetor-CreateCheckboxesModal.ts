import {
    App,
    ButtonComponent,
    Modal,
    Setting,
    ToggleComponent,
} from "obsidian";
import { MAKE_IT_SO } from "./snippetor-Defaults";
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

        this.cfg.taskSettings.forEach((t) => {
            if (t.taskColorDark && !t.taskColorLight) {
                t.taskColorLight = t.taskColorDark;
            } else if (t.taskColorLight && !t.taskColorDark) {
                t.taskColorDark = t.taskColorLight;
            }
        });
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
                    .setIcon(MAKE_IT_SO)
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

        const h3 = content.createEl("h3", {
            cls: "snippetor-reset",
            text: "Custom Task Values",
        });
        const reset = h3.createSpan("setting-item-control");
        new ButtonComponent(reset).setIcon("reset").onClick(() => {
            this.cfg = JSON.parse(JSON.stringify(this.snapshot)); // reset
            this.showTaskRows();
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
            this.createTaskRow(ts);
        });
    }

    createHeaderRow(callback: () => void): void {
        const heading = this.elements.list.createEl("li", {
            cls: "task-list-item",
        });
        const preview = heading.createSpan("snippetor-preview");
        preview.createEl("input", {
            cls: "task-list-item-checkbox",
            attr: {
                type: "checkbox",
            },
        });
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
        const settings = li.createSpan("snippetor-settings");
        this.showBasicSettings(taskSettings, li, checkbox, settings);

        // Twistie (moar settings!)

        // Remove
        new ButtonComponent(li)
            .setIcon("trash")
            .setTooltip("Delete this Task")
            .onClick(async () => {
                console.log("Delete %o", li);
                this.cfg.taskSettings.remove(taskSettings);
                this.showTaskRows();
            });
    }

    showBasicSettings(
        taskSettings: TaskSettings,
        li: HTMLLIElement,
        checkbox: HTMLInputElement,
        settings: HTMLSpanElement
    ): void {
        const i = this.id++;

        // Specify the task character
        const dataTask = settings.createEl("input", {
            cls: "snippetor-data-task",
            attr: {
                type: "text",
                name: "task-" + i,
                size: "1",
                value: taskSettings.data,
                title: "Task value",
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
        const taskColor = settings.createEl("input", {
            cls: "snippetor-data-color",
            attr: {
                name: "color-" + i,
                type: "color",
                value: this.getThemeColor(taskSettings),
                title: "Foreground color for the task",
            },
        });
        taskColor.addEventListener(
            "input",
            () => {
                this.setThemeColor(taskSettings, taskColor.value);
                this.applyColor(taskSettings, li, checkbox);
            },
            false
        );

        // sync light/dark mode
        const colorSync = settings.createSpan({
            text: "🌗",
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
                    taskColor.value = taskSettings.taskColorDark;
                } else {
                    taskColor.value = taskSettings.taskColorLight;
                }
                this.setThemeColor(taskSettings, taskColor.value);
                this.applyColor(taskSettings, li, checkbox);
            },
            false
        );

        // should the color apply to the text, too?
        const colorText = settings.createEl("input", {
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
        settings.createEl("label", {
            text: "apply color to text",
            attr: { for: "text-color-" + i },
        });

        // strikethrough?
        const strikethrough = settings.createEl("input", {
            attr: {
                name: "strikethrough-" + i,
                type: "checkbox",
            },
        });
        if (taskSettings.strkethrough) {
            strikethrough.setAttribute("checked", "");
        }
        strikethrough.addEventListener(
            "click",
            () => {
                taskSettings.strkethrough = strikethrough.checked;
                this.applySettingsToListItem(taskSettings, li);
            },
            false
        );
        settings.createEl("label", {
            text: "strikethrough",
            attr: { for: "strikethrough-" + i },
        });
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

        if (taskSettings.strkethrough) {
            li.style.textDecoration = "line-through";
        } else {
            li.style.textDecoration = "none";
        }
        if (taskSettings.applyTextColor) {
            this.setColor(taskSettings, li);
        } else {
            li.style.removeProperty("color");
        }
    }

    applySettingsToCheckbox(
        taskSettings: TaskSettings,
        checkbox: HTMLInputElement
    ): void {
        if (taskSettings.data !== " ") {
            checkbox.setAttribute("checked", "");
            checkbox.setAttribute("data", taskSettings.data);
        } else {
            checkbox.removeAttribute("data");
        }
        this.setColorAttributes(taskSettings, checkbox);
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

    setColor(taskSettings: TaskSettings, element: HTMLElement): void {
        const taskColor = this.getThemeColor(taskSettings);
        if (taskColor && taskColor.length > 0) {
            element.style.color = taskColor;
        } else {
            element.style.removeProperty("color");
        }
    }

    setColorAttributes(taskSettings: TaskSettings, element: HTMLElement): void {
        const taskColor = this.getThemeColor(taskSettings);
        if (taskColor && taskColor.length > 0) {
            element.style.borderColor = taskColor;
            element.style.color = taskColor;
            element.setAttribute("color", taskColor);
        } else {
            element.style.removeProperty("border-color");
            element.style.removeProperty("color");
            element.removeAttribute("color");
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
