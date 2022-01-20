import { App, ButtonComponent, Modal, Setting } from "obsidian";
import {
    DEFAULT_TASK_SETTINGS,
    DEFAULT_TASK_SNIPPET_SETTINGS,
} from "./snippitor-Defaults";
import type {
    TaskSnippetConfig,
    TaskSettings,
    ConstructedElements,
} from "./@types";
import { generateSlug } from "random-word-slugs";

export function openCreateCheckboxModal(
    app: App,
    taskSnippetCfg: TaskSnippetConfig
): Promise<TaskSnippetConfig> {
    return new Promise((resolve) => {
        const modal = new CreateCheckboxesModal(app, taskSnippetCfg);
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

    constructor(app: App, taskSnippetCfg: TaskSnippetConfig) {
        super(app);
        this.containerEl.id = "snippitor-checkboxes-modal";
        this.cfg =
            taskSnippetCfg ||
            Object.assign({}, DEFAULT_TASK_SNIPPET_SETTINGS, {
                name: generateSlug(2),
            });
    }

    onOpen(): void {
        const elements: ConstructedElements = {
            tasks: [],
            items: [],
        };

        const content = this.contentEl.createDiv(
            "snippitor-checkboxes markdown-preview-view"
        );

        content.createEl("h2", { text: "Snippetor: Tasks" });
        const nameDiv = content.createDiv();
        new Setting(nameDiv)
            .setName("Name of generated snippet (filename)")
            .addText((text) => {
                text.setPlaceholder("trigger")
                    .setValue(this.cfg.name)
                    .onChange((value) => {
                        this.cfg.name = value;
                    });
            });

        content.createEl("h3", { text: "Custom Task Values" });

        const list = content.createEl("ul");
        this.createHeaderRow(list);

        for (let i = 0; i < this.cfg.taskSettings.length; i++) {
            const taskSettings = this.cfg.taskSettings[i];
            this.createTaskRow(list, taskSettings, i, elements);
        }

        new Setting(content)
            .setClass("snippitor-create-task")
            .addButton((button: ButtonComponent) =>
                button
                    .setTooltip("Add a task type")
                    .setButtonText("+")
                    .onClick(() => {
                        const taskSettings = Object.assign(
                            DEFAULT_TASK_SETTINGS
                        );
                        this.createTaskRow(
                            list,
                            taskSettings,
                            elements.tasks.length,
                            elements
                        );
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
                    elements.tasks.forEach((t) =>
                        this.applyCommonSettingsToCheckbox(t)
                    );
                });
            });
    }

    onClose(): void {
        this.contentEl.empty();
    }

    createHeaderRow(list: HTMLUListElement): void {
        const heading = list.createEl("li", {
            cls: "task-list-item preview",
        });
        heading.createEl("input", {
            cls: "snippitor-box1",
            attr: {
                type: "checkbox",
                style: "pointer-events: none;",
            },
        });
        heading.createSpan({
            cls: "snippitor-box2",
            text: "Preview",
            attr: {
                style: "pointer-events: none;",
            },
        });
        heading.createSpan({ text: "| ", cls: "separator" });
        heading.createSpan({ text: "Settings", cls: "snippitor-box3" });
    }

    createTaskRow(
        list: HTMLUListElement,
        taskSettings: TaskSettings,
        i: number,
        elements: ConstructedElements
    ): void {
        const li = list.createEl("li");
        this.applySettingsToListItem(taskSettings, li);
        elements.items.push(li);

        // Example: Checkbox -- attributes will be updated
        const checkbox = li.createEl("input", {
            cls: "snippitor-box1",
            attr: {
                type: "checkbox",
                style: "pointer-events: none;",
            },
        });
        this.applySettingsToCheckbox(taskSettings, checkbox);
        this.applyCommonSettingsToCheckbox(checkbox);
        elements.tasks.push(checkbox);

        // Example: Sample text -- attributes will be updated
        const text = li.createEl("span", {
            text: " example ",
            cls: "snippitor-box2",
            attr: {
                style: "pointer-events: none; width: 66px; max-width: 66px;",
            },
        });
        li.createSpan({ text: "| ", cls: "separator" });

        // Settings..

        // What the task character should be
        const dataTask = li.createEl("input", {
            cls: "snippitor-data-task",
            attr: {
                type: "text",
                name: "task-" + i,
                size: "1",
                value: taskSettings.data,
            },
        });
        dataTask.addEventListener(
            "blur",
            () => {
                taskSettings.data = dataTask.value;
                this.applySettingsToListItem(taskSettings, li);
                this.applySettingsToCheckbox(taskSettings, checkbox);
            },
            false
        );

        // the checkbox / symbol color
        const taskColor = li.createEl("input", {
            cls: "snippitor-data-color",
            attr: {
                name: "color-" + i,
                type: "color",
                value: taskSettings.taskColor,
            },
        });
        taskColor.addEventListener(
            "input",
            () => {
                taskSettings.taskColor = taskColor.value;
                this.applyColor(taskSettings, li, checkbox);
            },
            false
        );

        // should the color apply to the text, too?
        const colorText = li.createEl("input", {
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
        li.createEl("label", {
            text: "apply color to text",
            attr: { for: "text-color-" + i },
        });

        // strikethrough?
        const strikethrough = li.createEl("input", {
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
        li.createEl("label", {
            text: "strikethrough",
            attr: { for: "strikethrough-" + i },
        });
    }

    applyColor(
        settings: TaskSettings,
        li: HTMLLIElement,
        checkbox: HTMLInputElement
    ): void {
        console.log(
            "Apply color: %o, %o",
            settings,
            checkbox.style.color,
            li.style.color
        );
        this.applySettingsToCheckbox(settings, checkbox);
        this.applySettingsToListItem(settings, li);
    }

    applySettingsToListItem(
        taskSettings: TaskSettings,
        li: HTMLLIElement
    ): void {
        console.log("Apply settings to item: %o", taskSettings);
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
        console.log("Apply settings to task: %o", taskSettings);

        checkbox.className = "task-list-item-checkbox";
        checkbox.id = "snippitor-checkbox-" + taskSettings.data;
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

    setColor(taskSettings: TaskSettings, element: HTMLElement): void {
        if (taskSettings.taskColor.length > 0) {
            element.style.color = taskSettings.taskColor;
        } else {
            element.style.removeProperty("color");
        }
    }

    setColorAttributes(taskSettings: TaskSettings, element: HTMLElement): void {
        if (taskSettings.taskColor.length > 0) {
            element.style.borderColor = taskSettings.taskColor;
            element.style.color = taskSettings.taskColor;
            element.setAttribute("color", taskSettings.taskColor);
        } else {
            element.style.removeProperty("border-color");
            element.style.removeProperty("color");
            element.removeAttribute("color");
        }
    }
}
