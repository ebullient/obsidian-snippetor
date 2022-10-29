import {
    ButtonComponent,
    ExtraButtonComponent,
    Setting,
    ToggleComponent,
} from "obsidian";
import { ColoredElement, FormattedElement, SnippetConfig } from "./@types";
import { COLOR } from "./snippetor-Defaults";
import { Snippetor } from "./snippetor-Snippetor";

/**
 * Helper for colors and creating modal dialog elements.
 *
 * This should not outlive the content element passed to the
 * constructor.
 */
export class ModalHelper {
    snippetor: Snippetor;
    containerEl: HTMLElement;
    content: HTMLElement;
    canvas: HTMLCanvasElement;
    foreground: string;
    background: string;

    // The container element (for the modal) supports light/dark mode toggle
    // The content element should have fg/bg colors assigned specifically
    constructor(
        snippetor: Snippetor,
        containerEl: HTMLElement,
        content: HTMLElement
    ) {
        this.snippetor = snippetor;
        this.containerEl = containerEl;
        this.content = content;
        this.canvas = content.createEl("canvas", {
            attr: {
                style: "display: none",
            },
        });
        this.getDefaultColors();
    }

    private getDefaultColors(): void {
        const ctx = this.canvas.getContext("2d");

        // default colors to hex for color selectors
        ctx.fillStyle = getComputedStyle(this.content).color;
        this.foreground = ctx.fillStyle;

        ctx.fillStyle = getComputedStyle(this.content).backgroundColor;
        this.background = ctx.fillStyle;
    }

    get isLightMode(): boolean {
        return (
            this.containerEl.hasClass("theme-light") ||
            (!this.containerEl.hasClass("theme-dark") &&
                document.body.hasClass("theme-light"))
        );
    }

    get foregroundDefault(): string {
        return this.foreground;
    }

    get backgroundDefault(): string {
        return this.background;
    }

    getColor(element: ColoredElement, color?: COLOR): string {
        if (this.isLightMode) {
            if (color === COLOR.BACKGROUND) {
                return element.lightMode === undefined ||
                    element.lightMode.background === undefined
                    ? "transparent"
                    : element.lightMode.background;
            }
            return element.lightMode === undefined ||
                element.lightMode.foreground === undefined
                ? "inherit"
                : element.lightMode.foreground;
        }

        if (color === COLOR.BACKGROUND) {
            return element.darkMode === undefined ||
                element.darkMode.background === undefined
                ? "transparent"
                : element.darkMode.background;
        }
        return element.darkMode === undefined ||
            element.darkMode.foreground === undefined
            ? "inherit"
            : element.darkMode.foreground;
    }

    // Change the style value into a value that works for the color picker
    getPickerValue(
        element: ColoredElement,
        color?: COLOR,
        hidePicker?: boolean
    ): string {
        const value = this.getColor(element, color);
        if (hidePicker) {
            return value;
        }
        if (color === COLOR.BACKGROUND) {
            return value === "transparent" ? this.backgroundDefault : value;
        }
        return value === "inherit" ? this.foregroundDefault : value;
    }

    setColor(element: ColoredElement, value: string, color?: COLOR): void {
        if (!value) {
            return;
        }
        if (this.isLightMode) {
            if (color === COLOR.BACKGROUND) {
                element.lightMode.background = value;
            } else {
                element.lightMode.foreground = value;
            }
        } else {
            if (color === COLOR.BACKGROUND) {
                element.darkMode.background = value;
            } else {
                element.darkMode.foreground = value;
            }
        }
    }

    // return the setting from the opposite mode
    syncModeColor(element: ColoredElement, color?: COLOR): string {
        if (this.isLightMode) {
            return color === COLOR.BACKGROUND
                ? this.valueOrDefault(
                      element.darkMode.background,
                      "transparent"
                  )
                : this.valueOrDefault(element.darkMode.foreground, "inherit");
        }

        return color === COLOR.BACKGROUND
            ? this.valueOrDefault(element.lightMode.background, "transparent")
            : this.valueOrDefault(element.lightMode.foreground, "inherit");
    }

    valueOrDefault(source: string, fallback: string): string {
        return source ? source : fallback;
    }

    // reset (remove the color setting)
    clearModeColor(element: ColoredElement, color?: COLOR): void {
        if (this.isLightMode) {
            if (color === COLOR.BACKGROUND) {
                delete element.lightMode.background;
            } else {
                delete element.lightMode.foreground;
            }
        }

        if (color === COLOR.BACKGROUND) {
            delete element.darkMode.background;
        } else {
            delete element.darkMode.foreground;
        }
    }

    createThemeToggleComponent(
        container: HTMLElement,
        callback: () => void
    ): void {
        const toggle = new ToggleComponent(container)
            .setValue(this.isLightMode)
            .setTooltip(
                `Switch to ${this.isLightMode ? "dark" : "light"} mode`
            );
        toggle.onChange(async (value) => {
            if (value) {
                this.containerEl.addClass("theme-light");
                this.containerEl.removeClass("theme-dark");
            } else {
                this.containerEl.addClass("theme-dark");
                this.containerEl.removeClass("theme-light");
            }
            this.getDefaultColors();
            toggle.setTooltip(
                `Switch to ${this.isLightMode ? "dark" : "light"} mode`
            );
            return callback();
        });
        toggle.toggleEl.addClass("theme-toggle");
    }

    createColorPickerComponent(
        container: HTMLElement,
        element: ColoredElement,
        name: string,
        update: (value: string) => void,
        color?: COLOR,
        hidePicker?: boolean
    ): HTMLInputElement {
        const initial = this.getPickerValue(element, color, hidePicker);
        const which = color === COLOR.BACKGROUND ? "Background" : "Foreground";
        const colorInput = container.createEl("input", {
            cls: "snippetor-data-color-txt",
            attr: {
                name: name,
                value: initial,
                title: `${which} color: ${initial}`,
            },
        });
        if (hidePicker) {
            colorInput.setAttribute("type", "text");
            colorInput.setAttribute("size", "8");
        } else {
            colorInput.setAttribute("type", "color");
        }
        colorInput.addEventListener(
            "input",
            () => {
                colorInput.title = `${which} color ${colorInput.value}`;
                return update(colorInput.value);
            },
            false
        );
        return colorInput;
    }

    createColorSyncComponent(
        container: HTMLElement,
        element: ColoredElement,
        color: COLOR,
        callback: (value: string) => void
    ): HTMLSpanElement {
        const result = container.createSpan({
            text: "🌗",
            cls: "color-sync",
            attr: {
                "aria-label": `Copy value from ${
                    this.isLightMode ? "dark" : "light"
                } mode`,
                style: "cursor: pointer",
            },
        });
        result.addEventListener(
            "click",
            () => {
                const value = this.syncModeColor(element, color);
                callback(value);
            },
            false
        );
        return result;
    }

    createResetColorComponent(
        container: HTMLElement,
        callback: () => void,
        color?: COLOR
    ): ExtraButtonComponent {
        const which = color === COLOR.BACKGROUND ? "background" : "foreground";
        return new ExtraButtonComponent(container)
            .setIcon("reset")
            .setTooltip(`Reset ${which} color to default`)
            .onClick(callback);
    }

    createExpandCollapseComponents(
        container: HTMLElement,
        expanded: boolean,
        callback: (expanded: boolean) => void
    ): void {
        const showExtra = new ExtraButtonComponent(container)
            .setIcon("enlarge-glyph")
            .setTooltip("Show additional options")
            .onClick(() => {
                showExtra.extraSettingsEl.removeClass("is-visible");
                hideExtra.extraSettingsEl.addClass("is-visible");
                callback(true);
            });
        const hideExtra = new ExtraButtonComponent(container)
            .setIcon("compress-glyph")
            .setTooltip("Hide additional options")
            .onClick(() => {
                showExtra.extraSettingsEl.addClass("is-visible");
                hideExtra.extraSettingsEl.removeClass("is-visible");
                callback(false);
            });
        showExtra.extraSettingsEl.addClass("toggle-extra");
        hideExtra.extraSettingsEl.addClass("toggle-extra");

        // initial state
        if (expanded) {
            showExtra.extraSettingsEl.removeClass("is-visible");
            hideExtra.extraSettingsEl.addClass("is-visible");
        } else {
            showExtra.extraSettingsEl.addClass("is-visible");
            hideExtra.extraSettingsEl.removeClass("is-visible");
        }
    }

    createBoldButton(
        container: HTMLElement,
        element: FormattedElement,
        update: (enabled: boolean) => void
    ): ButtonComponent {
        const result = new ButtonComponent(container)
            .setIcon("bold-glyph")
            .setTooltip("Bold text")
            .onClick(() => {
                const enabled = this.toggleSetIsActive(result.buttonEl);
                update(enabled);
            });
        if (element.format && element.format.bold) {
            result.buttonEl.addClass("is-active");
        } else {
            result.buttonEl.removeClass("is-active");
        }
        return result;
    }

    createItalicButton(
        container: HTMLElement,
        element: FormattedElement,
        update: (enabled: boolean) => void
    ): ButtonComponent {
        const result = new ButtonComponent(container)
            .setIcon("italic-glyph")
            .setTooltip("Italic text")
            .onClick(() => {
                const enabled = this.toggleSetIsActive(result.buttonEl);
                update(enabled);
            });
        if (element.format && element.format.italics) {
            result.buttonEl.addClass("is-active");
        } else {
            result.buttonEl.removeClass("is-active");
        }

        return result;
    }

    createStrikethroughButton(
        container: HTMLElement,
        element: FormattedElement,
        update: (enabled: boolean) => void
    ): ButtonComponent {
        const result = new ButtonComponent(container)
            .setIcon("strikethrough-glyph")
            .setTooltip("Stikethrough text")
            .onClick(() => {
                const enabled = this.toggleSetIsActive(result.buttonEl);
                update(enabled);
            });
        if (element.format && element.format.strikethrough) {
            result.buttonEl.addClass("is-active");
        } else {
            result.buttonEl.removeClass("is-active");
        }

        return result;
    }

    createToggleButton(
        container: HTMLElement,
        enabled: boolean,
        update: (enabled: boolean) => void
    ): ButtonComponent {
        const result = new ButtonComponent(container).onClick(() => {
            const enabled = this.toggleSetIsActive(result.buttonEl);
            update(enabled);
        });
        if (enabled) {
            result.buttonEl.addClass("is-active");
        } else {
            result.buttonEl.removeClass("is-active");
        }
        return result;
    }

    toggleSetIsActive(element: HTMLElement, enabled?: boolean): boolean {
        if (element.hasClass("is-active") || enabled) {
            element.removeClass("is-active");
            return false;
        }

        element.addClass("is-active");
        return true;
    }

    createFilenameSetting(content: HTMLDivElement, cfg: SnippetConfig): void {
        new Setting(content)
            .setName("Name of generated snippet (filename)")
            .setClass("snippet-filename")
            .addText((text) => {
                text.setPlaceholder("trigger")
                    .setValue(cfg.name)
                    .onChange((value) => {
                        cfg.name = value;
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
                        await this.snippetor.generateCss(cfg);
                        button.buttonEl.removeClass("is-active");
                        button.disabled = false;
                    })
            );
    }

    createHtmlStyleElement(cfg: SnippetConfig): HTMLStyleElement {
        const style = document.createElement("style");
        if (cfg.cssFontImport) {
            style.replaceChildren(document.createTextNode(cfg.cssFontImport));
        }
        document.getElementsByTagName("head")[0].appendChild(style);
        return style;
    }

    createImportFontSetting(
        content: HTMLDivElement,
        cfg: SnippetConfig,
        style: HTMLStyleElement
    ): void {
        const result = new Setting(content)
            .setName("Import (CSS) additional fonts")
            .setDesc(
                "Cut/paste a CSS @import statement to add an additional font to this snippet."
            )
            .addTextArea((t) =>
                t.setValue(cfg.cssFontImport).onChange((v) => {
                    const redraw = v != cfg.cssFontImport;
                    cfg.cssFontImport = v;
                    if (redraw) {
                        style.replaceChildren(
                            document.createTextNode(cfg.cssFontImport)
                        );
                    }
                })
            );
        result.controlEl.addClass("font-import");
        result.infoEl.addClass("font-import");
    }
}
