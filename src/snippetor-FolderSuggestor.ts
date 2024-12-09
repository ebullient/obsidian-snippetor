import { type Instance as PopperInstance, createPopper } from "@popperjs/core";
import {
    type App,
    type CachedMetadata,
    type FuzzyMatch,
    FuzzySuggestModal,
    Scope,
    type SuggestModal,
    TFolder,
    type TextComponent,
} from "obsidian";

declare module "obsidian" {
    interface App {
        keymap: {
            pushScope(scope: Scope): void;
            popScope(scope: Scope): void;
        };
    }
}

class Suggester<T> {
    owner: SuggestModal<T>;
    items: T[];
    suggestions: HTMLDivElement[];
    selectedItem: number;
    containerEl: HTMLElement;
    constructor(
        owner: SuggestModal<T>,
        containerEl: HTMLElement,
        scope: Scope,
    ) {
        this.containerEl = containerEl;
        this.owner = owner;
        containerEl.on(
            "click",
            ".suggestion-item",
            this.onSuggestionClick.bind(this),
        );
        containerEl.on(
            "mousemove",
            ".suggestion-item",
            this.onSuggestionMouseover.bind(this),
        );

        scope.register([], "ArrowUp", () => {
            this.setSelectedItem(this.selectedItem - 1, true);
            return false;
        });

        scope.register([], "ArrowDown", () => {
            this.setSelectedItem(this.selectedItem + 1, true);
            return false;
        });

        scope.register([], "Enter", (evt) => {
            this.useSelectedItem(evt);
            return false;
        });

        scope.register([], "Tab", (evt) => {
            this.chooseSuggestion(evt);
            return false;
        });
    }
    chooseSuggestion(evt: KeyboardEvent) {
        if (!this.items || !this.items.length) return;
        const currentValue = this.items[this.selectedItem];
        if (currentValue) {
            this.owner.onChooseSuggestion(currentValue, evt);
        }
    }
    onSuggestionClick(event: MouseEvent, el: HTMLDivElement): void {
        event.preventDefault();
        if (!this.suggestions || !this.suggestions.length) return;

        const item = this.suggestions.indexOf(el);
        this.setSelectedItem(item, false);
        this.useSelectedItem(event);
    }

    onSuggestionMouseover(event: MouseEvent, el: HTMLDivElement): void {
        if (!this.suggestions || !this.suggestions.length) return;
        const item = this.suggestions.indexOf(el);
        this.setSelectedItem(item, false);
    }
    empty() {
        this.containerEl.empty();
    }
    setSuggestions(items: T[]) {
        this.containerEl.empty();
        const els: HTMLDivElement[] = [];

        for (const item of items) {
            const suggestionEl = this.containerEl.createDiv("suggestion-item");
            this.owner.renderSuggestion(item, suggestionEl);
            els.push(suggestionEl);
        }

        this.items = items;
        this.suggestions = els;
        this.setSelectedItem(0, false);
    }
    useSelectedItem(event: MouseEvent | KeyboardEvent) {
        if (!this.items || !this.items.length) return;
        const currentValue = this.items[this.selectedItem];
        if (currentValue) {
            this.owner.selectSuggestion(currentValue, event);
        }
    }
    wrap(value: number, size: number): number {
        return ((value % size) + size) % size;
    }
    setSelectedItem(index: number, scroll: boolean) {
        const nIndex = this.wrap(index, this.suggestions.length);
        const prev = this.suggestions[this.selectedItem];
        const next = this.suggestions[nIndex];

        if (prev) prev.removeClass("is-selected");
        if (next) next.addClass("is-selected");

        this.selectedItem = nIndex;

        if (scroll) {
            next.scrollIntoView(false);
        }
    }
}

export abstract class SuggestionModal<T> extends FuzzySuggestModal<T> {
    items: T[] = [];
    suggestions: HTMLDivElement[];
    popper: PopperInstance;
    scope: Scope = new Scope();
    suggester: Suggester<FuzzyMatch<T>>;
    suggestEl: HTMLDivElement;
    promptEl: HTMLDivElement;
    emptyStateText = "No match found";
    limit = 100;
    shouldNotOpen: boolean;
    constructor(app: App, inputEl: HTMLInputElement, items: T[]) {
        super(app);
        this.inputEl = inputEl;
        this.items = items;

        this.suggestEl = createDiv("suggestion-container");

        this.contentEl = this.suggestEl.createDiv("suggestion");

        this.suggester = new Suggester(this, this.contentEl, this.scope);

        this.scope.register([], "Escape", this.onEscape.bind(this));

        this.inputEl.addEventListener("input", this.onInputChanged.bind(this));
        this.inputEl.addEventListener("focus", this.onFocus.bind(this));
        this.inputEl.addEventListener("blur", this.close.bind(this));
        this.suggestEl.on(
            "mousedown",
            ".suggestion-container",
            (event: MouseEvent) => {
                event.preventDefault();
            },
        );
    }
    onInputChanged(): void {
        if (this.shouldNotOpen) return;
        const inputStr = this.modifyInput(this.inputEl.value);
        const suggestions = this.getSuggestions(inputStr);
        if (suggestions.length > 0) {
            this.suggester.setSuggestions(suggestions.slice(0, this.limit));
        } else {
            this.onNoSuggestion();
        }
        this.open();
    }
    onFocus(): void {
        this.shouldNotOpen = false;
        this.onInputChanged();
    }
    modifyInput(input: string): string {
        return input;
    }
    onNoSuggestion(): void {
        this.suggester.empty();
        this.renderSuggestion(
            null,
            this.contentEl.createDiv("suggestion-item"),
        );
    }
    open(): void {
        // TODO: Figure out a better way to do this. Idea from Periodic Notes plugin
        this.app.keymap.pushScope(this.scope);

        document.body.appendChild(this.suggestEl);
        this.popper = createPopper(this.inputEl, this.suggestEl, {
            placement: "bottom-start",
            modifiers: [
                {
                    name: "offset",
                    options: {
                        offset: [0, 10],
                    },
                },
                {
                    name: "flip",
                    options: {
                        fallbackPlacements: ["top"],
                    },
                },
            ],
        });
    }

    onEscape(): void {
        this.close();
        this.shouldNotOpen = true;
    }
    close(): void {
        // TODO: Figure out a better way to do this. Idea from Periodic Notes plugin
        this.app.keymap.popScope(this.scope);

        this.suggester.setSuggestions([]);
        if (this.popper) {
            this.popper.destroy();
        }

        this.suggestEl.detach();
    }
    abstract onChooseItem(item: T, evt: MouseEvent | KeyboardEvent): void;
    abstract getItemText(arg: T): string;
    abstract getItems(): T[];
}

export class FolderSuggestionModal extends SuggestionModal<TFolder> {
    text: TextComponent;
    cache: CachedMetadata;
    folders: TFolder[];
    folder: TFolder;
    constructor(app: App, input: TextComponent, items: TFolder[]) {
        super(app, input.inputEl, items);
        this.folders = [...items];
        this.text = input;

        this.inputEl.addEventListener("input", () => this.getFolder());
    }
    getFolder(): void {
        const v = this.inputEl.value;
        const folder = this.app.vault.getAbstractFileByPath(v);

        if (folder === this.folder) return;
        if (!(folder instanceof TFolder)) return;
        this.folder = folder;

        this.onInputChanged();
    }
    getItemText(item: TFolder): string {
        return item.path;
    }
    onChooseItem(item: TFolder): void {
        this.text.setValue(item.path);
        this.folder = item;
    }
    selectSuggestion({ item }: FuzzyMatch<TFolder>): void {
        const link = item.path;

        this.folder = item;

        this.text.setValue(link);
        this.onClose();

        this.close();
    }
    renderSuggestion(result: FuzzyMatch<TFolder>, el: HTMLElement): void {
        const { item, match: matches } = result || {};
        const content = el.createDiv({
            cls: "suggestion-content",
        });
        if (!item) {
            content.setText(this.emptyStateText);
            content.parentElement.addClass("is-selected");
            return;
        }

        const pathLength = item.path.length - item.name.length;
        const matchElements = matches.matches.map((m) => {
            return createSpan("suggestion-highlight");
        });
        for (let i = pathLength; i < item.path.length; i++) {
            const match = matches.matches.find((m) => m[0] === i);
            if (match) {
                const element = matchElements[matches.matches.indexOf(match)];
                content.appendChild(element);
                element.appendText(item.path.substring(match[0], match[1]));

                i += match[1] - match[0] - 1;
                continue;
            }

            content.appendText(item.path[i]);
        }
        el.createDiv({
            cls: "suggestion-note",
            text: item.path,
        });
    }

    getItems(): TFolder[] {
        return this.folders;
    }
}
