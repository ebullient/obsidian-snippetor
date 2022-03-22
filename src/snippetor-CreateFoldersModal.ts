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
    snippetor: Snippetor
): Promise<FolderSnippetConfig> {
    return new Promise((resolve) => {
        const modal = new CreateFolderModal(
            app,
            folderSnippetConfig,
            snippetor
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
    /* id: number; */
    /* elements: ConstructedElements; */
    helper: ModalHelper;
    snippetor: Snippetor;

    constructor(
        app: App,
        folderSnippetCfg: FolderSnippetConfig,
        snippetor: Snippetor
    ) {
        super(app);
        this.snippetor = snippetor;
        this.containerEl.addClass("snippetor-folders-modal");
        this.containerEl.id = "snippetor-modal";
        this.cfg = folderSnippetCfg || snippetor.createNewFolderSnippetCfg();

        // Ensure required config, migrate old data
        this.snippetor.initCommonConfig(this.cfg);

        // save snapshot of settings
        this.original = JSON.parse(JSON.stringify(this.cfg));
    }

    onOpen(): void {
        this.titleEl.createSpan({ text: "Snippetor: Folders" });

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
            text: "Custom Folder Values",
        });

        const tableEl = content.createDiv("folders-content-container");

        const headerEl = tableEl.createDiv("folders-header");
        /*  Build File Nav structure here.
            .nav-files-container
                .nav-folder.mod-root
                    .nav-folder-children
                        .nav-folder.is-collapsed
                        .nav-file
        */
        const folderEl = tableEl
            .createDiv("nav-files-container")
            .createDiv("nav-folder mod-root")
            .createDiv("nav-folder-children");

        this.createHeader(headerEl, folderEl);
        this.showFolders(folderEl);

        new Setting(content)
            .setClass("snippetor-create-task")
            .addButton((button: ButtonComponent) =>
                button
                    .setTooltip("Add a folder")
                    .setButtonText("+")
                    .onClick(() => {
                        const folderSettings =
                            this.snippetor.createNewFolderCfg(null);
                        this.createFolderItem(folderEl, folderSettings);
                        this.cfg.folders.push(folderSettings);
                    })
            );

        content.createEl("h3", {
            text: "Additional settings",
        });
        new Setting(content)
            .setName("Use hover animations")
            .setDesc("Folders will show a hover transition")
            .addToggle((t) => {
                t.setValue(this.cfg.hoverDecoration).onChange((v) => {
                    this.cfg.hoverDecoration = v;
                    this.showFolders(folderEl);
                });
            });
        new Setting(content)
            .setName("Show relationship lines")
            .addToggle((t) => {
                t.setValue(this.cfg.relationshipLines).onChange((v) => {
                    this.cfg.relationshipLines = v;
                    this.showFolders(folderEl);
                });
            });
        new Setting(content)
            .setName("Show folder icon")
            .setDesc("A folder icon will be shown before folder names")
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
    }

    finish(): void {
        this.contentEl.empty();
        // do not persist the transient cache
        if (this.cfg.default) {
            Reflect.deleteProperty(this.cfg.default, "cache");
        }
        this.cfg.folders.forEach((ts) => Reflect.deleteProperty(ts, "cache"));
        this.cfg.folders = this.cfg.folders.filter(f => f.target && f.target.length);
        // make sure a name is set
        this.snippetor.initCommonConfig(this.cfg);
    }

    createHeader(headerEl: HTMLElement, folderEl: HTMLElement): void {
        headerEl.empty();
        headerEl.createSpan({
            cls: "snippetor-preview",
            text: "Preview",
        });

        const settings = headerEl.createDiv("header");

        settings.createSpan({
            text: "Settings",
        });
        const settingActions = settings.createDiv("header-actions");
        const roundGroup = settingActions.createSpan(
            "snippetor-checkbox-roundness"
        );
        const roundness = new SliderComponent(roundGroup)
            .setValue(
                this.cfg.borderRadius === undefined ? 0 : this.cfg.borderRadius
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
        roundness.sliderEl.title = "Folder roundness";
        roundness.sliderEl.name = "snippetor-border-radius";

        this.helper.createThemeToggleComponent(settingActions, () =>
            this.showFolders(folderEl)
        );
        const actions = headerEl.createSpan("snippetor-li-actions");

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
        isDefault = false
    ): void {
        const containerEl = folderEl.createDiv("snippetor-folder-container");

        const preview = containerEl.createDiv(
            `nav-folder is-collapsed ${
                this.cfg.folderIcon ? "folder-icon" : ""
            } ${this.cfg.hoverDecoration ? "hover" : ""}`
        );
        preview.addEventListener("click", () => {
            preview.toggleClass(
                "is-collapsed",
                !preview.hasClass("is-collapsed")
            );
        });
        const title = preview.createDiv({
            cls: `nav-folder-title ${
                this.cfg.hideCollapse ? "no-collapse" : ""
            }`,
        });
        setIcon(
            title.createDiv("nav-folder-collapse-indicator collapse-icon"),
            "right-triangle"
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
            };
        }
        folderSettings.cache.folderEl = preview;

        const settings = containerEl.createDiv("snippetor-settings");
        if (!isDefault) {
            const folders = this.app.vault
                .getRoot()
                .children?.filter(
                    (f) =>
                        f instanceof TFolder &&
                        !this.cfg.folders.find((t) => t.target == f.path)
                ) as TFolder[];
            const text = new TextComponent(settings)
                .onChange((v) => {
                    folderSettings.target = v;
                    content.setText(folderSettings.target);
                })
                .setPlaceholder(folderSettings.target ?? "Folder Name");

            const suggestor = new FolderSuggestionModal(
                this.app,
                text,
                folders
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
            "Text",
            "Text",
            (v) => {
                this.helper.setColor(folderSettings, v, COLOR.FOREGROUND);
                this.setFolderColors(folderSettings);
            }
        );
        this.backgroundColorPicker(colors, folderSettings, "BG", "BG", (v) => {
            this.helper.setColor(folderSettings, v, COLOR.BACKGROUND);
            this.setFolderColors(folderSettings);
        });

        const actions = containerEl.createSpan("snippetor-li-actions");

        new ExtraButtonComponent(actions)
            .setIcon("trash")
            .setTooltip("Delete this Task")
            .onClick(async () => {
                console.log("Delete %o", containerEl);
                this.cfg.folders.remove(folderSettings);
                this.showFolders(folderEl);
            });

        this.setFolderColors(folderSettings);
    }

    setFolderColors(folderSettings: FolderConfig) {
        const textColor = this.helper.getColor(
            folderSettings,
            COLOR.FOREGROUND
        );
        const backgroundColor = this.helper.getColor(
            folderSettings,
            COLOR.BACKGROUND
        );

        const folderEl = folderSettings.cache.folderEl;

        folderEl.style.setProperty("--snippetor-fg-color", textColor);
        folderEl.style.setProperty("--snippetor-bg-color", backgroundColor);
        folderEl.style.setProperty(
            "--snippetor-border-radius",
            `${this.cfg.borderRadius}px`
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
        const colorPicker = this.helper.createColorPickerComponent(
            colorGroup,
            element,
            name,
            update,
            COLOR.FOREGROUND
        );
        // sync light/dark mode
        this.helper.createColorSyncComponent(
            colorGroup,
            element,
            COLOR.FOREGROUND,
            (value) => {
                colorPicker.value = this.helper.getPickerValue(
                    element,
                    COLOR.FOREGROUND
                );
                update(value);
            }
        );
        // reset input element
        const resetFg = this.helper.createResetColorComponent(
            colorGroup,
            async () => {
                this.helper.clearModeColor(element, COLOR.FOREGROUND);
                colorPicker.value = this.helper.getPickerValue(
                    element,
                    COLOR.FOREGROUND
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
        const colorPicker = this.helper.createColorPickerComponent(
            colorGroup,
            element,
            name,
            update,
            COLOR.BACKGROUND
        );
        // sync light/dark mode
        this.helper.createColorSyncComponent(
            colorGroup,
            element,
            COLOR.BACKGROUND,
            (value) => {
                colorPicker.value = this.helper.getPickerValue(
                    element,
                    COLOR.BACKGROUND
                );
                update(value);
            }
        );
        // reset input element
        const reset = this.helper.createResetColorComponent(
            colorGroup,
            async () => {
                this.helper.clearModeColor(element, COLOR.BACKGROUND);
                colorPicker.value = this.helper.getPickerValue(
                    element,
                    COLOR.BACKGROUND
                );
                update(undefined);
            },
            COLOR.BACKGROUND
        );
        reset.extraSettingsEl.addClass("no-padding");
    }

    verifyDataValue(input: HTMLInputElement) {
        input.removeClass("data-value-error");
        input.removeAttribute("aria-label");
    }
}
