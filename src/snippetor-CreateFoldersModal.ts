import {
    App,
    ButtonComponent,
    ExtraButtonComponent,
    Modal,
    setIcon,
    Setting,
    SliderComponent,
    TextComponent,
    TFolder,
} from "obsidian";
import type {
    ColoredElement,
    FolderSnippetConfig,
    FolderConfig,
} from "./@types";
import { Snippetor } from "./snippetor-Snippetor";
import { ModalHelper } from "./snippetor-ModalHelper";
import { COLOR } from "./snippetor-Defaults";
import { FolderSuggestionModal } from "./snippetor-FolderSuggestor";

export function openCreateFolderModal(
    app: App,
    folderSnippetConfig: FolderSnippetConfig,
    snippetor: Snippetor,
): Promise<FolderSnippetConfig> {
    return new Promise((resolve) => {
        const modal = new CreateFolderModal(
            app,
            folderSnippetConfig,
            snippetor,
        );

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

class CreateFolderModal extends Modal {
    cfg: FolderSnippetConfig;
    original: FolderSnippetConfig[];
    id: number;
    helper: ModalHelper;
    snippetor: Snippetor;
    style: HTMLStyleElement;
    defaultFontSize: number;

    constructor(
        app: App,
        folderSnippetCfg: FolderSnippetConfig,
        snippetor: Snippetor,
    ) {
        super(app);
        this.snippetor = snippetor;
        this.containerEl.addClass("snippetor-folders-modal");
        this.containerEl.id = "snippetor-modal";

        // Ensure required config, migrate old data
        this.cfg = this.snippetor.initFolderSnippetConfig(
            folderSnippetCfg || snippetor.createNewFolderSnippetCfg(),
        );

        // save snapshot of settings
        this.original = JSON.parse(JSON.stringify(this.cfg));
        this.id = 0;
    }

    onOpen(): void {
        this.titleEl.createSpan({ text: "Snippetor: Folders" });

        const content = this.contentEl.createDiv("snippetor-content");

        this.helper = new ModalHelper(
            this.snippetor,
            this.containerEl,
            content,
        );
        this.style = this.helper.createHtmlStyleElement(this.cfg);
        this.helper.createFilenameSetting(content, this.cfg);

        content.createEl("h3", {
            text: "Custom Folder Values",
        });

        const tableEl = content.createDiv("folders-content-container");
        const headerEl = tableEl.createDiv("folders-header");

        /* folderEl == Build File Nav structure here.
            .workspace-leaf-content data-type="file-explorer"
                .nav-files-container
                    .nav-folder.mod-root
                        .nav-folder-children
                            .nav-folder.is-collapsed
                            .nav-file
        */
        const folderEl = tableEl
            .createDiv("folders")
            .createDiv({
                cls: "workspace-leaf-content",
                attr: {
                    "data-type": "file-explorer",
                },
            })
            .createDiv("nav-files-container")
            .createDiv("nav-folder mod-root")
            .createDiv("nav-folder-children");

        // this will be cleared/emptied with showFolders
        const basicFolderTitle = folderEl
            .createDiv("nav-folder")
            .createDiv("nav-folder-title")
            .createDiv("nav-folder-title-content");

        this.defaultFontSize = Math.ceil(
            Number(
                getComputedStyle(basicFolderTitle).fontSize.replace("px", ""),
            ),
        );

        this.createHeader(headerEl, folderEl);
        this.showFolders(folderEl);

        new Setting(content)
            .setClass("snippetor-create-folder")
            .addButton((button: ButtonComponent) =>
                button
                    .setTooltip("Add a folder")
                    .setButtonText("+")
                    .onClick(() => {
                        const folderSettings =
                            this.snippetor.createNewFolderCfg(null);
                        this.createFolderItem(folderEl, folderSettings);
                        this.cfg.folders.push(folderSettings);
                    }),
            );

        content.createEl("h3", {
            text: "Additional settings",
        });
        new Setting(content)
            .setName("Use hover animations")
            .setDesc("Snippet will include a customized hover transition")
            .addToggle((t) => {
                t.setValue(this.cfg.hoverDecoration).onChange((v) => {
                    this.cfg.hoverDecoration = v;
                    this.showFolders(folderEl);
                });
            });
        new Setting(content)
            .setName("Use folder icons")
            .setDesc("A common folder icon will be shown before folder names")
            .addToggle((t) => {
                t.setValue(this.cfg.folderIcon).onChange((v) => {
                    this.cfg.folderIcon = v;
                    this.showFolders(folderEl);
                });
            });
        new Setting(content)
            .setName("Hide the collapse icon")
            .setDesc("The collapse indicator will not be shown")
            .addToggle((t) => {
                t.setValue(this.cfg.hideCollapse).onChange((v) => {
                    this.cfg.hideCollapse = v;
                    this.showFolders(folderEl);
                });
            });
        new Setting(content)
            .setName("Hide the file type tag")
            .setDesc("File types (such as JPG) will not be displayed")
            .addToggle((t) => {
                t.setValue(this.cfg.hideTypes).onChange((v) => {
                    this.cfg.hideTypes = v;
                    this.showFolders(folderEl);
                });
            });
        new Setting(content)
            .setName("Hide the scrollbar")
            .setDesc("Hide the file menu scrollbar.")
            .addToggle((t) => {
                t.setValue(this.cfg.hideScrollbar).onChange((v) => {
                    this.cfg.hideScrollbar = v;
                    this.showFolders(folderEl);
                });
            });

        this.helper.createImportFontSetting(content, this.cfg, this.style);
    }

    finish(): void {
        this.contentEl.empty();
        // do not persist the transient cache
        if (this.cfg.default) {
            Reflect.deleteProperty(this.cfg.default, "cache");
        }
        this.cfg.folders.forEach((ts) => Reflect.deleteProperty(ts, "cache"));
        this.cfg.folders = this.cfg.folders.filter(
            (f) => f.target && f.target.length,
        );
        // make sure a name is set
        this.snippetor.initCommonConfig(this.cfg);
    }

    createHeader(headerEl: HTMLElement, folderEl: HTMLElement): void {
        headerEl.empty();
        headerEl.createSpan({
            cls: "snippetor-preview",
            text: "Folder preview",
        });

        headerEl.createSpan({
            text: "Settings",
            cls: "header",
        });

        const actions = headerEl.createDiv("snippetor-li-actions");

        const roundGroup = actions.createSpan("snippetor-folder-roundness");
        const roundness = new SliderComponent(roundGroup)
            .setValue(
                this.cfg.borderRadius === undefined ? 0 : this.cfg.borderRadius,
            )
            .setLimits(0, 25, 1)
            .setDynamicTooltip()
            .onChange((v) => {
                const redraw = v != this.cfg.borderRadius;
                this.cfg.borderRadius = v;
                if (redraw) {
                    this.showFolders(folderEl);
                }
            });
        roundness.sliderEl.title = "Folder background roundness";
        roundness.sliderEl.name = "snippetor-border-radius";

        this.helper.createThemeToggleComponent(actions, () =>
            this.showFolders(folderEl),
        );

        const reset = new ExtraButtonComponent(actions)
            .setIcon("reset")
            .setTooltip("Reset to previously saved (or generated) values")
            .onClick(() => {
                this.cfg = JSON.parse(JSON.stringify(this.original)); // reset
                this.showFolders(folderEl);
            });
        reset.extraSettingsEl.addClass("no-padding");
        reset.extraSettingsEl.addClass("settings-reset");
    }

    showFolders(folderEl: HTMLElement) {
        folderEl.empty();

        /* this.createFolderItem(this.cfg.default, true); */
        for (const folder of this.cfg.folders) {
            this.createFolderItem(folderEl, folder);
        }
    }

    createFolderItem(
        folderEl: HTMLElement,
        folderSettings: FolderConfig,
        isDefault = false,
    ): void {
        const containerEl = folderEl.createDiv("snippetor-folder-container");

        const preview = containerEl.createDiv(
            `nav-folder is-collapsed ${
                this.cfg.folderIcon ? "folder-icon" : ""
            } ${this.cfg.hoverDecoration ? "hover" : ""}`,
        );
        preview.addEventListener("click", () => {
            folderSettings.cache.expanded = !preview.hasClass("is-collapsed");
            preview.toggleClass(
                "is-collapsed",
                !preview.hasClass("is-collapsed"),
            );
        });
        const title = preview.createDiv({
            cls: `nav-folder-title ${
                this.cfg.hideCollapse ? "no-collapse" : ""
            }`,
        });
        setIcon(
            title.createDiv("nav-folder-collapse-indicator collapse-icon"),
            "right-triangle",
        );
        const content = title.createDiv({
            cls: "nav-folder-title-content",
            text: isDefault
                ? "Default Folder"
                : folderSettings.target ?? "Folder Name",
        });
        if (!folderSettings.cache) {
            folderSettings.cache = {
                folderEl: null,
                titleEl: null,
            };
        }
        folderSettings.cache.folderEl = preview;
        folderSettings.cache.titleEl = content;

        const settings = containerEl.createDiv({
            cls: "snippetor-settings",
            attr: {
                style: `font-weight: normal; font-size: ${this.defaultFontSize}px`,
            },
        });
        this.drawSettings(folderSettings, settings, content);

        const actions = containerEl.createSpan("snippetor-li-actions");
        this.helper.createExpandCollapseComponents(
            actions,
            folderSettings.cache.expanded,
            (expanded) => {
                folderSettings.cache.expanded = expanded;
                this.drawSettings(folderSettings, settings, content);
            },
        );
        new ExtraButtonComponent(actions)
            .setIcon("trash")
            .setTooltip("Delete this Folder configuration")
            .onClick(async () => {
                console.log("Delete %o", containerEl);
                this.cfg.folders.remove(folderSettings);
                this.showFolders(folderEl);
            });

        this.setFolderColors(folderSettings);
    }

    drawSettings(
        folderSettings: FolderConfig,
        parent: HTMLSpanElement,
        content: HTMLDivElement,
        isDefault = false,
    ): void {
        const i = this.id++;
        parent.empty();

        const settings = parent.createSpan("snippetor-row");
        if (!isDefault) {
            const folders = this.app.vault
                .getRoot()
                .children?.filter(
                    (f) =>
                        f instanceof TFolder &&
                        !this.cfg.folders.find((t) => t.target == f.path),
                ) as TFolder[];

            const folderNameGroup = settings.createSpan(
                "snippetor-group aligned-1",
            );
            const text = new TextComponent(folderNameGroup)
                .onChange((v) => {
                    folderSettings.target = v;
                    content.setText(folderSettings.target);
                })
                .setPlaceholder(folderSettings.target ?? "Folder Name");

            const suggestor = new FolderSuggestionModal(
                this.app,
                text,
                folders,
            );

            suggestor.onClose = () => {
                folderSettings.target = suggestor.folder.path;
                content.setText(folderSettings.target);
            };
        }

        const colors = settings.createDiv();
        this.foregroundColorPicker(
            colors,
            folderSettings,
            `folder-color-fg-${i}`,
            "text:",
            (v) => {
                this.helper.setColor(folderSettings, v, COLOR.FOREGROUND);
                this.setFolderColors(folderSettings);
            },
        );
        this.backgroundColorPicker(
            colors,
            folderSettings,
            `folder-color-bg-${i}`,
            "bg:",
            (v) => {
                this.helper.setColor(folderSettings, v, COLOR.BACKGROUND);
                this.setFolderColors(folderSettings);
            },
        );

        const subfolder = this.helper.createToggleButton(
            settings,
            folderSettings.includeChildren,
            (enabled) => {
                folderSettings.includeChildren = enabled;
                this.setFolderColors(folderSettings);
            },
        );
        subfolder
            .setIcon("stacked-levels")
            .setTooltip("Toggle: Apply background color to subfolders");

        if (folderSettings.cache.expanded) {
            this.drawFolderFontSettings(folderSettings, parent, i);
            this.drawFolderIconSettings(folderSettings, parent, i);
        }
    }

    drawFolderIconSettings(
        folderSettings: FolderConfig,
        parent: HTMLSpanElement,
        i: number,
    ): void {
        const settings = parent.createSpan("snippetor-row");
        const initalValue = this.helper.valueOrDefault(
            folderSettings.content,
            "",
        );

        const iconGroup = settings.createSpan("snippetor-group aligned-1");
        iconGroup.createEl("label", {
            text: "Icon:",
            attr: { for: `folder-icon-${i}` },
        });
        const folderContent = iconGroup.createEl("input", {
            cls: "snippetor-folder-content",
            attr: {
                type: "text",
                name: `folder-icon-${i}`,
                size: "1",
                value: initalValue,
                title: "Emoji to display in front of folder name",
            },
        });
        folderContent.addEventListener(
            "input",
            () => {
                folderSettings.content = folderContent.value;
                this.setFolderColors(folderSettings);
            },
            false,
        );
    }

    drawFolderFontSettings(
        folderSettings: FolderConfig,
        parent: HTMLSpanElement,
        i: number,
    ): void {
        const settings = parent.createSpan("snippetor-row");

        const fontGroup = settings.createSpan("snippetor-group aligned-1");
        fontGroup.createEl("label", {
            text: "Font:",
            attr: { for: `folder-font-${i}` },
        });
        const font = new TextComponent(fontGroup)
            .setValue(
                folderSettings.font === undefined ? "" : folderSettings.font,
            )
            .onChange((v) => {
                folderSettings.font = v;
                this.setFolderColors(folderSettings);
            });
        font.inputEl.addClass("snippetor-font-setting");
        font.inputEl.name = `folder-font-${i}`;

        const sizeGroup = settings.createSpan("snippetor-group decorated");
        sizeGroup.createEl("label", {
            text: "size: ",
            attr: { for: `folder-size-${i}` },
        });
        const fontSize = new SliderComponent(sizeGroup)
            .setValue(
                folderSettings.fontSize === undefined
                    ? this.defaultFontSize
                    : folderSettings.fontSize,
            )
            .setLimits(6, 30, 1)
            .setDynamicTooltip()
            .onChange((v) => {
                folderSettings.fontSize = v;
                this.setFolderColors(folderSettings);
            });
        fontSize.sliderEl.name = `folder-size-${i}`;

        new ExtraButtonComponent(sizeGroup)
            .setIcon("reset")
            .setTooltip("Reset font size to default")
            .onClick(async () => {
                fontSize.setValue(this.defaultFontSize);
                Reflect.deleteProperty(folderSettings, "fontSize");
                this.setFolderColors(folderSettings);
            })
            .extraSettingsEl.addClass("no-padding");
    }

    setFolderColors(folderSettings: FolderConfig) {
        const textColor = this.helper.getColor(
            folderSettings,
            COLOR.FOREGROUND,
        );
        const backgroundColor = this.helper.getColor(
            folderSettings,
            COLOR.BACKGROUND,
        );

        const folderEl = folderSettings.cache.folderEl;

        let font = "var(--font-text)";
        let fontSize = this.defaultFontSize + "px";
        if (folderSettings.font) {
            font = folderSettings.font;
        }
        if (folderSettings.fontSize) {
            fontSize = folderSettings.fontSize + "px";
        }

        folderEl.style.setProperty(
            "--snippetor-fg-color",
            textColor === "inherit" ? "var(--text-normal)" : textColor,
        );
        folderEl.style.setProperty("--snippetor-bg-color", backgroundColor);
        folderEl.style.setProperty(
            "--snippetor-border-radius",
            `${this.cfg.borderRadius}px`,
        );
        folderEl.style.setProperty("--snippetor-font", font);
        folderEl.style.setProperty("--snippetor-font-size", fontSize);

        folderSettings.cache.titleEl.removeAttribute("data");
        const data = folderSettings.content ? folderSettings.content + " " : "";
        folderSettings.cache.titleEl.setAttribute("data", data);
    }

    foregroundColorPicker(
        container: HTMLElement,
        element: ColoredElement,
        name: string,
        label: string,
        update: (value: string) => void,
    ) {
        const colorGroup = container.createSpan(
            "snippetor-group decorated color",
        );
        colorGroup.createEl("label", {
            text: label,
            attr: { for: name },
        });
        const colorPicker = this.helper.createColorPickerComponent(
            colorGroup,
            element,
            name,
            update,
            COLOR.FOREGROUND,
        );
        // sync light/dark mode
        this.helper.createColorSyncComponent(
            colorGroup,
            element,
            COLOR.FOREGROUND,
            (value) => {
                colorPicker.value = this.helper.getPickerValue(
                    element,
                    COLOR.FOREGROUND,
                );
                update(value);
            },
        );
        // reset input element
        const resetFg = this.helper.createResetColorComponent(
            colorGroup,
            async () => {
                this.helper.clearModeColor(element, COLOR.FOREGROUND);
                colorPicker.value = this.helper.getPickerValue(
                    element,
                    COLOR.FOREGROUND,
                );
                update(undefined);
            },
            COLOR.FOREGROUND,
        );
        resetFg.extraSettingsEl.addClass("no-padding");
    }

    backgroundColorPicker(
        container: HTMLElement,
        element: ColoredElement,
        name: string,
        label: string,
        update: (value: string) => void,
    ) {
        const colorGroup = container.createSpan(
            "snippetor-group decorated color",
        );
        colorGroup.createEl("label", {
            text: label,
            attr: { for: name },
        });
        const colorPicker = this.helper.createColorPickerComponent(
            colorGroup,
            element,
            name,
            update,
            COLOR.BACKGROUND,
        );
        // sync light/dark mode
        this.helper.createColorSyncComponent(
            colorGroup,
            element,
            COLOR.BACKGROUND,
            (value) => {
                colorPicker.value = this.helper.getPickerValue(
                    element,
                    COLOR.BACKGROUND,
                );
                update(value);
            },
        );
        // reset input element
        const reset = this.helper.createResetColorComponent(
            colorGroup,
            async () => {
                this.helper.clearModeColor(element, COLOR.BACKGROUND);
                colorPicker.value = this.helper.getPickerValue(
                    element,
                    COLOR.BACKGROUND,
                );
                update(undefined);
            },
            COLOR.BACKGROUND,
        );
        reset.extraSettingsEl.addClass("no-padding");
    }

    verifyDataValue(input: HTMLInputElement) {
        input.removeClass("data-value-error");
        input.removeAttribute("aria-label");
    }
}
