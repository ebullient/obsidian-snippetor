import type { Debouncer } from "obsidian";

const { requestUrl } = vi.hoisted(() => ({ requestUrl: vi.fn() }));

vi.mock("obsidian", () => ({
    ButtonComponent: vi.fn(),
    ExtraButtonComponent: vi.fn(),
    Setting: vi.fn(),
    ToggleComponent: vi.fn(),
    debounce: vi.fn((callback: (...args: never[]) => void) => {
        const debounced = ((...args: never[]) =>
            callback(...args)) as Debouncer<never[], void>;
        debounced.cancel = () => debounced;
        debounced.run = () => undefined;
        return debounced;
    }),
    requestUrl,
}));

import { ModalHelper } from "../src/snippetor-ModalHelper";

class TestStyleSheet {
    css = "";

    replaceSync(css: string): void {
        this.css = css;
    }
}

const adoptedSheets = new WeakMap<object, CSSStyleSheet[]>();

function installAdoptedStyleSheetSupport(): void {
    vi.stubGlobal("CSSStyleSheet", TestStyleSheet);
    Object.defineProperty(Document.prototype, "adoptedStyleSheets", {
        configurable: true,
        get(): CSSStyleSheet[] {
            return adoptedSheets.get(this) ?? [];
        },
        set(value: CSSStyleSheet[]) {
            adoptedSheets.set(this, value);
        },
    });
}

function createHelper(containerEl: HTMLElement): ModalHelper {
    const helper = Object.create(ModalHelper.prototype) as ModalHelper;
    helper.containerEl = containerEl;
    helper.snippetor = {
        logDebug: vi.fn(),
    } as never;
    helper.fontRequest = 0;
    helper.fontClosed = false;
    helper.updateFontPreview = {
        cancel: vi.fn(),
    } as unknown as Debouncer<[string | undefined], void>;
    return helper;
}

afterEach(() => {
    document.adoptedStyleSheets = [];
    requestUrl.mockReset();
});

test("removes only its own font stylesheet from the document", async () => {
    installAdoptedStyleSheetSupport();
    requestUrl.mockResolvedValue({ text: "@font-face { font-family: Test; }" });

    const containerEl = document.createElement("div");
    Object.defineProperty(containerEl, "doc", {
        value: document,
        configurable: true,
    });
    const existingSheet = new TestStyleSheet() as CSSStyleSheet;
    document.adoptedStyleSheets = [existingSheet];
    const helper = createHelper(containerEl);

    await helper.loadFontPreview(
        "@import url('https://fonts.googleapis.com/css2?family=Test');",
    );

    expect(containerEl.shadowRoot).toBeNull();
    expect(document.adoptedStyleSheets).toHaveLength(2);

    helper.removeFontPreview();

    expect(document.adoptedStyleSheets).toEqual([existingSheet]);
});

test("does not fetch font imports from other origins", async () => {
    installAdoptedStyleSheetSupport();

    const containerEl = document.createElement("div");
    Object.defineProperty(containerEl, "doc", {
        value: document,
        configurable: true,
    });
    const helper = createHelper(containerEl);

    await helper.loadFontPreview(
        "@import url('https://fonts.example.test/test.css');",
    );

    expect(requestUrl).not.toHaveBeenCalled();
});

test("does not add a font stylesheet after the preview is removed", async () => {
    installAdoptedStyleSheetSupport();
    requestUrl.mockResolvedValue({ text: "@font-face { font-family: Test; }" });

    const containerEl = document.createElement("div");
    Object.defineProperty(containerEl, "doc", {
        value: document,
        configurable: true,
    });
    const helper = createHelper(containerEl);

    helper.removeFontPreview();
    await helper.loadFontPreview(
        "@import url('https://fonts.googleapis.com/css2?family=Test');",
    );

    expect(requestUrl).not.toHaveBeenCalled();
    expect(document.adoptedStyleSheets).toHaveLength(0);
});

test("removes the font stylesheet when the import is cleared", async () => {
    installAdoptedStyleSheetSupport();
    requestUrl.mockResolvedValue({ text: "@font-face { font-family: Test; }" });

    const containerEl = document.createElement("div");
    Object.defineProperty(containerEl, "doc", {
        value: document,
        configurable: true,
    });
    const helper = createHelper(containerEl);

    await helper.loadFontPreview(
        "@import url('https://fonts.googleapis.com/css2?family=Test');",
    );
    expect(document.adoptedStyleSheets).toHaveLength(1);

    await helper.loadFontPreview(undefined);

    expect(document.adoptedStyleSheets).toHaveLength(0);
});
