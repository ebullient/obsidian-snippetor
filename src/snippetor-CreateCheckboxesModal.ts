import {
    App,
    ButtonComponent,
    ExtraButtonComponent,
    Modal,
    Setting,
    SliderComponent,
    TextComponent,
    ToggleComponent,
} from "obsidian";
import type {
    TaskSnippetConfig,
    TaskSettings,
    ConstructedElements,
    ColoredElement,
} from "./@types";
import { Snippetor } from "./snippetor-Snippetor";
import { ModalHelper } from "./snippetor-ModalHelper";
import { COLOR, LOCK, UNLOCK } from "./snippetor-Defaults";

export function openCreateCheckboxModal(
    app: App,
    taskSnippetCfg: TaskSnippetConfig,
    snippetor: Snippetor
): Promise<TaskSnippetConfig> {
    return new Promise((resolve) => {
        const modal = new CreateCheckboxesModal(app, taskSnippetCfg, snippetor);

        modal.onClose = () => {
            try {
                modal.finish();
                resolve(modal.cfg);
            } catch (error) {
                console.log("Caught %o, rejecting promise", error);
                Promise.reject();
            }
        };

        try {
            modal.open();
        } catch (error) {
            console.log("Caught %o, rejecting promise", error);
            Promise.reject();
        }
    });
}

class CreateCheckboxesModal extends Modal {
    cfg: TaskSnippetConfig;
    origTaskSettings: TaskSettings;
    id: number;
    elements: ConstructedElements;
    helper: ModalHelper;
    snippetor: Snippetor;
    style: HTMLStyleElement;

    constructor(
        app: App,
        taskSnippetCfg: TaskSnippetConfig,
        snippetor: Snippetor
    ) {
        super(app);
        this.snippetor = snippetor;
        this.containerEl.addClass("snippetor-checkboxes-modal");
        this.containerEl.id = "snippetor-modal";
        this.cfg = taskSnippetCfg || snippetor.createNewTaskSnippetCfg();

        // Ensure required config, migrate old task data
        this.snippetor.initConfig(this.cfg);

        // save snapshot of task settings
        this.origTaskSettings = JSON.parse(
            JSON.stringify(this.cfg.taskSettings)
        );

        this.elements = {};
        this.id = 0;
    }

    onOpen(): void {
        this.titleEl.createSpan({ text: "Snippetor: Tasks" });
        this.style = document.createElement("style");
        this.style.replaceChildren(
            document.createTextNode(this.cfg.cssFontImport)
        );
        document.getElementsByTagName("head")[0].appendChild(this.style);

        const content = this.contentEl.createDiv(
            "snippetor-content markdown-preview-view"
        );

        this.helper = new ModalHelper(
            this.snippetor,
            this.containerEl,
            content
        );

        new Setting(content)
            .setName("Name of generated snippet (filename)")
            .setClass("snippet-filename")
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
        this.elements.list.addClass("contains-task-list");

        this.showTasks();

        new Setting(content)
            .setClass("snippetor-create-task")
            .addButton((button: ButtonComponent) =>
                button
                    .setTooltip("Add a task type")
                    .setButtonText("+")
                    .onClick(() => {
                        const taskSettings =
                            this.snippetor.createNewTaskCfg("");
                        this.createTaskItem(taskSettings);
                        this.cfg.taskSettings.push(taskSettings);
                    })
            );

        content.createEl("h3", {
            text: "Additional settings",
        });

        new Setting(content)
            .setName("Define style for incomplete tasks")
            .setDesc("Add a special row to style incomplete (unchecked) items.")
            .addToggle((t) => {
                t.setValue(this.cfg.styleUncheckedTask).onChange((v) => {
                    const redraw = v != this.cfg.styleUncheckedTask;
                    this.cfg.styleUncheckedTask = v;
                    if (redraw) {
                        this.showTasks();
                    }
                });
            });

        new Setting(content)
            .setName("Import (CSS) additional fonts")
            .setDesc(
                "Cut/paste a CSS @import statement to add an additional font to your snippet. Only do this if you don't have the font you want already installed from another snippet."
            )
            .addTextArea((t) =>
                t.setValue(this.cfg.cssFontImport).onChange((v) => {
                    const redraw = v != this.cfg.cssFontImport;
                    this.cfg.cssFontImport = v;
                    if (redraw) {
                        this.style.replaceChildren(
                            document.createTextNode(this.cfg.cssFontImport)
                        );
                    }
                })
            );
    }

    finish(): void {
        document.getElementsByTagName("head")[0].removeChild(this.style);
        this.contentEl.empty();
        this.elements = {};
        // do not persist the transient cache
        if (this.cfg.uncheckedTask) {
            Reflect.deleteProperty(this.cfg.uncheckedTask, "cache");
        }
        this.cfg.taskSettings.forEach((ts) =>
            Reflect.deleteProperty(ts, "cache")
        );
        // make sure a name is set
        this.snippetor.initCommonConfig(this.cfg);
    }

    showTasks(): void {
        this.elements.list.empty();
        this.cfg.taskSettings.forEach((ts) => {
            this.resetTaskElements(ts);
        });
        if (this.cfg.uncheckedTask) {
            this.resetTaskElements(this.cfg.uncheckedTask);
        }

        // Create a header.
        this.createHeader();

        if (this.cfg.styleUncheckedTask) {
            // Add an item for styling unchecked tasks to the list
            if (this.cfg.uncheckedTask === undefined) {
                this.cfg.uncheckedTask = this.snippetor.createNewTaskCfg(" ");
                this.cfg.uncheckedTask.unchecked = true;
            }
            console.log(this.cfg.uncheckedTask);
            this.createTaskItem(this.cfg.uncheckedTask, true);
        }

        this.cfg.taskSettings.forEach((ts) => {
            this.createTaskItem(ts);
        });
    }

    createHeader(): void {
        const heading = this.elements.list.createEl("li", {
            cls: "task-list-item",
        });

        const preview = heading.createSpan("snippetor-preview");

        const checkbox = preview.createEl("input", {
            cls: "task-list-item-checkbox snippetor",
            attr: {
                type: "checkbox",
            },
        });
        const example = preview.createSpan({
            text: "unchecked",
            cls: "example",
        });
        heading.createSpan({
            text: "Settings",
            cls: "header",
        });

        if (this.cfg.styleUncheckedTask) {
            // make the preview checkbox invisible
            checkbox.style.borderStyle = "hidden";
            checkbox.style.background = "none";
            example.style.color = "transparent";
        }
        this.elements.defaultFontSize = Math.ceil(
            Number(getComputedStyle(checkbox).fontSize.replace("px", ""))
        );

        const actions = heading.createSpan("snippetor-li-actions");

        const roundGroup = actions.createSpan("snippetor-checkbox-roundness");
        const roundness = new SliderComponent(roundGroup)
            .setValue(
                this.cfg.borderRadius === undefined ? 0 : this.cfg.borderRadius
            )
            .setLimits(0, 50, 2)
            .setDynamicTooltip()
            .onChange((v) => {
                const redraw = v != this.cfg.borderRadius;
                this.cfg.borderRadius = v;
                if (redraw) {
                    if (this.cfg.styleUncheckedTask) {
                        this.applySettingsToCheckbox(this.cfg.uncheckedTask);
                    }
                    this.cfg.taskSettings.forEach((ts) => {
                        this.applySettingsToCheckbox(ts);
                    });
                }
            });
        roundness.sliderEl.title = "Checkbox roundness";
        roundness.sliderEl.name = "snippetor-border-radius";

        const hidePicker = new ToggleComponent(actions)
            .setValue(this.cfg.hideColorPicker)
            .setTooltip("Toggle color picker")
            .onChange((v) => {
                const redraw = v != this.cfg.hideColorPicker;
                this.cfg.hideColorPicker = v;
                if (redraw) {
                    this.showTasks();
                }
            });
        hidePicker.toggleEl.addClass("picker-toggle");

        this.helper.createThemeToggleComponent(actions, () => this.showTasks());

        const reset = new ExtraButtonComponent(actions)
            .setIcon("reset")
            .setTooltip("Reset to previously saved (or generated) values")
            .onClick(() => {
                this.cfg.taskSettings = JSON.parse(
                    JSON.stringify(this.origTaskSettings)
                ); // reset
                this.showTasks();
            });
        reset.extraSettingsEl.addClass("no-padding");
        reset.extraSettingsEl.addClass("settings-reset");
    }

    createTaskItem(taskSettings: TaskSettings, unchecked?: boolean): void {
        const itemEl = this.elements.list.createEl("li");
        const textEl = itemEl.createSpan("snippetor-preview");
        const checkboxEl = textEl.createEl("input", {
            cls: "task-list-item-checkbox snippetor",
            attr: {
                type: "checkbox",
                checked: "",
            },
        });

        taskSettings.cache.itemEl = itemEl;
        taskSettings.cache.textEl = textEl;
        taskSettings.cache.checkboxEl = checkboxEl;

        this.applySettingsToCheckbox(taskSettings);
        this.applySettingsToListItem(taskSettings);

        // Sample text -- attributes will be updated
        textEl.createSpan({ text: "example", cls: "example" });

        // Section for settings
        const settings = itemEl.createEl("div", {
            cls: "snippetor-settings",
            attr: {
                style: `font-weight: normal; text-decoration: none; font-size: ${this.elements.defaultFontSize}px`,
            },
        });

        this.drawSettings(taskSettings, settings);

        // Twistie: toggle display of more settings
        const actions = itemEl.createSpan("snippetor-li-actions");
        this.helper.createExpandCollapseComponents(
            actions,
            taskSettings.cache.expanded,
            (expanded) => {
                taskSettings.cache.expanded = expanded;
                this.drawSettings(taskSettings, settings);
            }
        );
        const remove = new ExtraButtonComponent(actions)
            .setIcon("trash")
            .setTooltip("Delete this Task")
            .onClick(async () => {
                console.log("Delete %o", itemEl);
                this.cfg.taskSettings.remove(taskSettings);
                this.showTasks();
            });
        if (taskSettings.unchecked) {
            remove.disabled = true;
            remove.extraSettingsEl.style.color = "transparent";
            remove.extraSettingsEl.style.pointerEvents = "none";
        }
    }

    drawSettings(ts: TaskSettings, parent: HTMLSpanElement): void {
        const i = this.id++;
        parent.empty();

        this.drawCheckboxSettings(ts, parent, i);
        if (ts.cache.expanded) {
            this.drawReadingModeCheckboxSettings(ts, parent, i);
            this.drawTextSettings(ts, parent, i);
        }
    }

    drawCheckboxSettings(
        ts: TaskSettings,
        parent: HTMLSpanElement,
        i: number
    ): void {
        const settings = parent.createSpan("snippetor-row");

        // Input box for the task character: UNLESS unchecked
        if (!ts.unchecked) {
            const sourceGroup = settings.createSpan(
                "snippetor-group decorated"
            );
            const dataTaskLabel = sourceGroup.createEl("label", {
                text: `- [${ts.data}]`,
                cls: "source-mode-label",
                attr: { for: `task-${i}` },
            });
            const dataTask = sourceGroup.createEl("input", {
                cls: "snippetor-data-task",
                attr: {
                    type: "text",
                    name: `task-${i}`,
                    size: "1",
                    value: ts.data,
                    title: "Source mode value",
                },
            });
            dataTask.addEventListener(
                "input",
                () => {
                    ts.data = dataTask.value;
                    dataTaskLabel.setText(`- [${dataTask.value}]`);
                    this.applySettingsToCheckbox(ts);
                    this.applySettingsToListItem(ts);
                    this.verifyDataValue(dataTask);
                },
                false
            );
            ts.cache.dataEl = dataTask;
            this.verifyDataValue(dataTask);
        }

        // the checkbox foreground
        this.foregroundColorPicker(
            settings,
            ts.checkbox,
            `checkbox-color-fg-${i}`,
            "fg:",
            (value) => {
                this.helper.setColor(ts.checkbox, value, COLOR.FOREGROUND);
                this.applySettingsToCheckbox(ts);
                if (ts.li.syncTaskColor) {
                    this.applySettingsToListItem(ts);
                }
            }
        );

        // the checkbox background
        this.backgroundColorPicker(
            settings,
            ts.checkbox,
            `checkbox-color-bg-${i}`,
            "bg:",
            (value) => {
                this.helper.setColor(ts.checkbox, value, COLOR.BACKGROUND);
                this.applySettingsToCheckbox(ts);
                if (ts.li.syncTaskColor) {
                    this.applySettingsToListItem(ts);
                }
            }
        );

        // Checkbox border
        const hideBorder = this.helper.createToggleButton(
            settings,
            ts.checkbox.hideBorder,
            (enabled) => {
                ts.checkbox.hideBorder = enabled;
                this.applySettingsToCheckbox(ts);
            }
        );
        hideBorder.setIcon("fullscreen").setTooltip("Toggle: Hide border");

        const lockMode = this.helper.createToggleButton(
            settings,
            ts.checkbox.preventClick,
            (enabled) => {
                ts.checkbox.preventClick = enabled;
                lockMode.setIcon(ts.checkbox.preventClick ? LOCK : UNLOCK);
                this.applySettingsToCheckbox(ts);
            }
        );
        lockMode
            .setIcon(ts.checkbox.preventClick ? LOCK : UNLOCK)
            .setTooltip("Toggle: Prevent mouse clicks in Preview mode");
    }

    drawReadingModeCheckboxSettings(
        ts: TaskSettings,
        parent: HTMLSpanElement,
        i: number
    ): void {
        const settings = parent.createSpan("snippetor-row");
        settings.createEl("label", {
            cls: "row-label",
            text: "Rendered: ",
            attr: { for: `task-reader-${i}` },
        });

        const initalValue = this.helper.valueOrDefault(
            ts.checkbox.readModeData,
            ts.data
        );

        const sourceGroup = settings.createSpan("snippetor-group decorated");
        const readModeData = sourceGroup.createEl("input", {
            cls: "snippetor-data-task",
            attr: {
                type: "text",
                name: `task-reader-${i}`,
                size: "1",
                value: initalValue,
                title: "Value shown in Live Preview or Reading mode",
            },
        });

        const chkboxGroup = settings.createSpan("snippetor-group decorated");
        chkboxGroup.createEl("label", {
            text: "Font:",
            attr: { for: `checkbox-font-${i}` },
        });
        new TextComponent(chkboxGroup)
            .setValue(
                ts.checkbox.format === undefined ||
                    ts.checkbox.format.font === undefined
                    ? ""
                    : ts.checkbox.format.font
            )
            .onChange((v) => {
                this.snippetor.initialize(ts, "checkbox", "format");
                ts.checkbox.format.font = v;
                this.applySettingsToCheckbox(ts);
            })
            .inputEl.addClass("snippetor-font-setting");

        const sizeGroup = settings.createSpan("snippetor-group decorated");
        const sizeLabel = sizeGroup.createEl("label", {
            text: `[${initalValue}] size: `,
            attr: { for: "size-" + i },
        });
        const fontSize = new SliderComponent(sizeGroup)
            .setValue(
                ts.checkbox.format === undefined ||
                    ts.checkbox.format.fontSize === undefined
                    ? this.elements.defaultFontSize
                    : ts.checkbox.format.fontSize
            )
            .setLimits(6, 30, 1)
            .setDynamicTooltip()
            .onChange((v) => {
                this.snippetor.initialize(ts, "checkbox", "format");
                ts.checkbox.format.fontSize = v;
                this.applySettingsToCheckbox(ts);
            });
        fontSize.sliderEl.name = "size-" + i;
        new ExtraButtonComponent(sizeGroup)
            .setIcon("reset")
            .setTooltip("Reset font size to default")
            .onClick(async () => {
                fontSize.setValue(this.elements.defaultFontSize);
                Reflect.deleteProperty(ts.checkbox.format, "fontSize");
                this.applySettingsToCheckbox(ts);
            })
            .extraSettingsEl.addClass("no-padding");

        // Size Event Listener: when read mode value is changed,
        // change the label on the size element, too
        readModeData.addEventListener(
            "input",
            () => {
                ts.checkbox.readModeData = readModeData.value;
                if (readModeData.value) {
                    sizeLabel.setText(`[${readModeData.value}] size: `);
                } else {
                    sizeLabel.setText(`[${ts.data}] size: `);
                }
                this.applySettingsToCheckbox(ts);
                this.applySettingsToListItem(ts);
            },
            false
        );

        this.positionAdjust(
            settings,
            `pos-x-${i}`,
            "x: ",
            1,
            ts.checkbox.left ? ts.checkbox.left : 1,
            (v) => {
                if (v) {
                    ts.checkbox.left = v;
                } else {
                    Reflect.deleteProperty(ts.checkbox, "left");
                }
                this.applySettingsToCheckbox(ts);
            }
        );

        this.positionAdjust(
            settings,
            `pos-y-${i}`,
            "y: ",
            0,
            ts.checkbox.top ? ts.checkbox.top : 0,
            (v) => {
                if (v) {
                    ts.checkbox.top = v;
                } else {
                    Reflect.deleteProperty(ts.checkbox, "top");
                }
                this.applySettingsToCheckbox(ts);
            }
        );
    }

    drawTextSettings(
        ts: TaskSettings,
        parent: HTMLSpanElement,
        i: number
    ): void {
        const settings = parent.createSpan("snippetor-row text-settings");
        settings.createSpan({
            cls: "row-label",
            text: "Text: ",
        });

        // List item text formatting
        const styleGroup = settings.createSpan("snippetor-group");
        this.helper
            .createBoldButton(styleGroup, ts.li, (enabled) => {
                this.snippetor.initialize(ts, "li", "format");
                ts.li.format.bold = enabled;
                this.applySettingsToListItem(ts);
            })
            .buttonEl.addClass("no-padding");
        this.helper
            .createItalicButton(styleGroup, ts.li, (enabled) => {
                this.snippetor.initialize(ts, "li", "format");
                ts.li.format.italics = enabled;
                this.applySettingsToListItem(ts);
            })
            .buttonEl.addClass("no-padding");
        this.helper
            .createStrikethroughButton(styleGroup, ts.li, (enabled) => {
                this.snippetor.initialize(ts, "li", "format");
                ts.li.format.strikethrough = enabled;
                this.applySettingsToListItem(ts);
            })
            .buttonEl.addClass("no-padding");

        const sizeGroup = settings.createSpan("snippetor-group decorated");
        sizeGroup.createEl("label", {
            text: `Font size: `,
            attr: { for: "size-" + i },
        });
        const fontSize = new SliderComponent(sizeGroup)
            .setValue(
                ts.li.format === undefined ||
                    ts.li.format.fontSize === undefined
                    ? this.elements.defaultFontSize
                    : ts.li.format.fontSize
            )
            .setLimits(6, 30, 1)
            .setDynamicTooltip()
            .onChange((v) => {
                this.snippetor.initialize(ts, "li", "format");
                ts.li.format.fontSize = v;
                this.applySettingsToListItem(ts);
            });
        fontSize.sliderEl.name = "size-" + i;
        new ExtraButtonComponent(sizeGroup)
            .setIcon("reset")
            .setTooltip("Reset font size to default")
            .onClick(async () => {
                fontSize.setValue(this.elements.defaultFontSize);
                Reflect.deleteProperty(ts.checkbox.format, "fontSize");
                this.applySettingsToListItem(ts);
            })
            .extraSettingsEl.addClass("no-padding");

        // Sync List item font?
        const useTaskFont = "🔡 = ☑︎";
        const useTextFont = "🔡 ≠ ☑︎";
        const textFontMode = this.helper.createToggleButton(
            settings,
            ts.li.syncTaskFont,
            (enabled) => {
                ts.li.syncTaskFont = enabled;
                textFontMode.buttonEl.setText(
                    ts.li.syncTaskFont ? useTaskFont : useTextFont
                );
                this.applySettingsToListItem(ts);
                if (ts.li.syncTaskFont) {
                    settings.addClass("hide-text-font");
                } else {
                    settings.removeClass("hide-text-font");
                }
            }
        );
        textFontMode.buttonEl.addClass("toggle-sync-font");
        textFontMode.setTooltip("Toggle: Sync text with task font");
        textFontMode.setButtonText(
            ts.li.syncTaskFont ? useTaskFont : useTextFont
        );
        if (ts.li.syncTaskFont) {
            settings.addClass("hide-text-font");
        }
        // List Item font
        const liGroup = settings.createSpan(
            "snippetor-group decorated li-font"
        );
        liGroup.createEl("label", {
            text: "Font:",
            attr: { for: `li-font-${i}` },
        });
        this.snippetor.initialize(ts, "li", "format");
        const textFont = new TextComponent(liGroup)
            .setValue(
                ts.li.format === undefined || ts.li.format.font === undefined
                    ? ""
                    : ts.li.format.font
            )
            .onChange((v) => {
                ts.li.format.font = v;
                this.applySettingsToListItem(ts);
            });
        textFont.inputEl.addClass("snippetor-font-setting");

        // Sync List item color?
        const useTaskColors = "🎨 = ☑︎";
        const useTextColors = "🎨 ≠ ☑︎";
        const textColorMode = this.helper.createToggleButton(
            settings,
            ts.li.syncTaskColor,
            (enabled) => {
                ts.li.syncTaskColor = enabled;
                textColorMode.buttonEl.setText(
                    ts.li.syncTaskColor ? useTaskColors : useTextColors
                );
                this.applySettingsToListItem(ts);
                if (ts.li.syncTaskColor) {
                    settings.addClass("hide-text-colors");
                } else {
                    settings.removeClass("hide-text-colors");
                }
            }
        );
        textColorMode.buttonEl.addClass("toggle-sync-color");
        textColorMode.setTooltip("Toggle: Sync text color with task color");
        textColorMode.setButtonText(
            ts.li.syncTaskColor ? useTaskColors : useTextColors
        );
        if (ts.li.syncTaskColor) {
            settings.addClass("hide-text-colors");
        }
        // the checkbox foreground
        this.foregroundColorPicker(
            settings,
            ts.li,
            `li-color-fg-${i}`,
            "fg:",
            (value) => {
                this.helper.setColor(ts.li, value, COLOR.FOREGROUND);
                this.applySettingsToListItem(ts);
            }
        );

        // the checkbox background
        this.backgroundColorPicker(
            settings,
            ts.li,
            `li-color-bg-${i}`,
            "bg:",
            (value) => {
                this.helper.setColor(ts.li, value, COLOR.BACKGROUND);
                this.applySettingsToListItem(ts);
            }
        );
    }

    foregroundColorPicker(
        container: HTMLElement,
        element: ColoredElement,
        name: string,
        label: string,
        update: (value: string) => void
    ) {
        const colorGroup = container.createSpan(
            "snippetor-group decorated color"
        );
        colorGroup.createEl("label", {
            text: label,
            attr: { for: name },
        });
        const taskColor = this.helper.createColorPickerComponent(
            colorGroup,
            element,
            name,
            update,
            COLOR.FOREGROUND,
            this.cfg.hideColorPicker
        );
        // sync light/dark mode
        this.helper.createColorSyncComponent(
            colorGroup,
            element,
            COLOR.FOREGROUND,
            (value) => {
                taskColor.value = this.helper.getPickerValue(
                    element,
                    COLOR.FOREGROUND,
                    this.cfg.hideColorPicker
                );
                update(value);
            }
        );
        // reset input element
        const resetFg = this.helper.createResetColorComponent(
            colorGroup,
            async () => {
                this.helper.clearModeColor(element, COLOR.FOREGROUND);
                taskColor.value = this.helper.getPickerValue(
                    element,
                    COLOR.FOREGROUND,
                    this.cfg.hideColorPicker
                );
                update(undefined);
            },
            COLOR.FOREGROUND
        );
        resetFg.extraSettingsEl.addClass("no-padding");
    }

    backgroundColorPicker(
        container: HTMLElement,
        element: ColoredElement,
        name: string,
        label: string,
        update: (value: string) => void
    ) {
        const colorGroup = container.createSpan(
            "snippetor-group decorated color"
        );
        colorGroup.createEl("label", {
            text: label,
            attr: { for: name },
        });
        const taskColor = this.helper.createColorPickerComponent(
            colorGroup,
            element,
            name,
            update,
            COLOR.BACKGROUND,
            this.cfg.hideColorPicker
        );
        // sync light/dark mode
        this.helper.createColorSyncComponent(
            colorGroup,
            element,
            COLOR.BACKGROUND,
            (value) => {
                taskColor.value = this.helper.getPickerValue(
                    element,
                    COLOR.BACKGROUND,
                    this.cfg.hideColorPicker
                );
                update(value);
            }
        );
        // reset input element
        const reset = this.helper.createResetColorComponent(
            colorGroup,
            async () => {
                this.helper.clearModeColor(element, COLOR.BACKGROUND);
                taskColor.value = this.helper.getPickerValue(
                    element,
                    COLOR.BACKGROUND,
                    this.cfg.hideColorPicker
                );
                update(undefined);
            },
            COLOR.BACKGROUND
        );
        reset.extraSettingsEl.addClass("no-padding");
    }

    positionAdjust(
        container: HTMLElement,
        name: string,
        label: string,
        base: number,
        initial: number,
        update: (value: number) => void
    ): void {
        const posGroup = container.createSpan(
            "snippetor-group decorated position"
        );
        posGroup.createEl("label", {
            text: label,
            attr: { for: name },
        });
        const position = new SliderComponent(posGroup)
            .setValue(initial)
            .setLimits(-12, 12, 1)
            .setDynamicTooltip()
            .onChange(update);
        position.sliderEl.name = name;
        new ExtraButtonComponent(posGroup)
            .setIcon("reset")
            .setTooltip("Reset position to default")
            .onClick(async () => {
                position.setValue(base);
                update(undefined);
            })
            .extraSettingsEl.addClass("no-padding");
    }

    applySettingsToListItem(taskSettings: TaskSettings): void {
        const textEl = taskSettings.cache.textEl;
        const itemEl = taskSettings.cache.itemEl;

        itemEl.setAttr("data-task", taskSettings.data);
        itemEl.className =
            "task-list-item" + (taskSettings.data == " " ? "" : " is-checked");
        this.setListItemColors(taskSettings);

        textEl.style.removeProperty("--snippetor-decoration");
        textEl.style.removeProperty("--snippetor-font");
        textEl.style.removeProperty("--snippetor-font-size");
        textEl.style.removeProperty("--snippetor-text-style");
        textEl.style.removeProperty("--snippetor-weight");

        let decoration = "none";
        let font = "var(--font-text)";
        let fontSize = this.elements.defaultFontSize + "px";
        let style = "normal";
        let weight = "500";

        if (taskSettings.li.format) {
            if (taskSettings.li.format.strikethrough) {
                decoration = "line-through";
            }
            if (taskSettings.li.format.bold) {
                weight = "700";
            }
            if (taskSettings.li.format.italics) {
                style = "italic";
            }
        }

        if (
            taskSettings.li.syncTaskFont &&
            taskSettings.checkbox.format &&
            taskSettings.checkbox.format.font
        ) {
            font = taskSettings.checkbox.format.font;
        } else if (taskSettings.li.format && taskSettings.li.format.font) {
            font = taskSettings.li.format.font;
        }

        if (taskSettings.li.format && taskSettings.li.format.fontSize) {
            fontSize = taskSettings.li.format.fontSize + "px";
        }

        textEl.style.setProperty("--snippetor-decoration", decoration);
        textEl.style.setProperty("--snippetor-font", font);
        textEl.style.setProperty("--snippetor-font-size", fontSize);
        textEl.style.setProperty("--snippetor-text-style", style);
        textEl.style.setProperty("--snippetor-weight", weight);
    }

    applySettingsToCheckbox(ts: TaskSettings): void {
        const checkbox = ts.cache.checkboxEl;
        checkbox.removeAttribute("data");

        checkbox.style.removeProperty("--snippetor-font");
        checkbox.style.removeProperty("--snippetor-font-size");
        checkbox.style.removeProperty("--snippetor-left");
        checkbox.style.removeProperty("--snippetor-top");

        const data = ts.checkbox.readModeData
            ? ts.checkbox.readModeData
            : ts.data;
        checkbox.setAttribute("data", data);

        let font = "var(--font-monospace)";
        let fontSize = this.elements.defaultFontSize + "px";

        if (ts.checkbox.format && ts.checkbox.format.font) {
            font = ts.checkbox.format.font;
        }
        if (ts.checkbox.format && ts.checkbox.format.fontSize) {
            fontSize = ts.checkbox.format.fontSize + "px";
        }

        checkbox.style.setProperty("--snippetor-font", font);
        checkbox.style.setProperty("--snippetor-font-size", fontSize);

        checkbox.style.setProperty(
            "--snippetor-top",
            (ts.checkbox.top ? ts.checkbox.top : 0) + "px"
        );
        checkbox.style.setProperty(
            "--snippetor-left",
            (ts.checkbox.left ? ts.checkbox.left : 0) + "px"
        );

        checkbox.style.borderRadius =
            (this.cfg.borderRadius ? this.cfg.borderRadius : 0) + "%";

        this.setCheckboxColors(ts);
    }

    setListItemColors(taskSettings: TaskSettings): void {
        const itemEl = taskSettings.cache.itemEl;
        const fgColor = this.helper.getColor(
            taskSettings.li.syncTaskColor
                ? taskSettings.checkbox
                : taskSettings.li,
            COLOR.FOREGROUND
        );
        const bgColor = this.helper.getColor(
            taskSettings.li.syncTaskColor
                ? taskSettings.checkbox
                : taskSettings.li,
            COLOR.BACKGROUND
        );
        itemEl.style.color = fgColor;
        itemEl.style.backgroundColor = bgColor;
    }

    setCheckboxColors(taskSettings: TaskSettings): void {
        const checkboxEl = taskSettings.cache.checkboxEl;
        const fgColor = this.helper.getColor(
            taskSettings.checkbox,
            COLOR.FOREGROUND
        );
        const bgColor = this.helper.getColor(
            taskSettings.checkbox,
            COLOR.BACKGROUND
        );

        // doing this the hard way because we have to override at least
        // one !important from themes
        checkboxEl.style.removeProperty("--snippetor-fg-color");
        checkboxEl.style.removeProperty("--snippetor-bg-color");
        checkboxEl.style.removeProperty("--snippetor-border-color");

        checkboxEl.style.setProperty(
            "--snippetor-fg-color",
            fgColor === "inherit" ? "var(--text-normal)" : fgColor
        );
        checkboxEl.style.setProperty("--snippetor-bg-color", bgColor);

        checkboxEl.style.setProperty(
            "--snippetor-border-color",
            taskSettings.checkbox.hideBorder ? "transparent" : fgColor
        );
    }

    verifyDataValue(input: HTMLInputElement) {
        input.removeClass("data-value-error");
        input.removeAttribute("aria-label");

        const count = this.cfg.taskSettings.filter(
            (t) => input.value === t.data
        ).length;
        if (count > 1) {
            console.log("verifyDataValue: conflict over %s", input.value);
            input.setAttribute("conflict", input.value);
            input.addClass("data-value-error");
            input.setAttribute(
                "aria-label",
                "Another task uses the same value"
            );
            this.cfg.taskSettings.forEach((ts) => {
                const e = ts.cache?.dataEl;
                if (
                    e &&
                    e.value === input.value &&
                    !e.hasAttribute("conflict")
                ) {
                    this.verifyDataValue(e);
                }
            });
        } else {
            const conflict = input.getAttribute("conflict");
            if (input.value === " ") {
                console.log("verifyDataValue: unchecked item");
                input.addClass("data-value-error");
                input.setAttribute(
                    "aria-label",
                    "Unchecked tasks are a special case. See additional settings."
                );
            } else if (input.value === "") {
                console.log("verifyDataValue: empty value");
                input.addClass("data-value-required");
                input.setAttribute(
                    "aria-label",
                    "Specify a task value, e.g. X"
                );
            } else if (conflict) {
                console.log("verifyDataValue: conflict resolved");
                input.removeAttribute("conflict");
                this.cfg.taskSettings.forEach((ts) => {
                    const e = ts.cache.dataEl;
                    if (e.value === conflict) {
                        this.verifyDataValue(e);
                    }
                });
            }
        }
    }

    resetTaskElements(ts: TaskSettings): void {
        for (const [key, value] of Object.entries(ts.cache)) {
            if (value instanceof HTMLElement) {
                Reflect.deleteProperty(ts.cache, key);
            }
        }
    }
}
