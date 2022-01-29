import { App, Modal } from "obsidian";
import { generateSlug } from "random-word-slugs";
import { SnippetConfig } from "./@types";
import { ModalHelper } from "./snippetor-ModalHelper";
import { Snippetor } from "./snippetor-Snippetor";

// return a promise with revised config
export function openCreateTemplateModal(
    app: App,
    snippetConfig: SnippetConfig, // replace with specific type
    snippetor: Snippetor
): Promise<SnippetConfig> {
    // replace with specific type
    return new Promise((resolve) => {
        const modal = new CreateTemplateModal(app, snippetConfig, snippetor);

        modal.onClose = () => {
            // make sure a name is set
            if (!modal.cfg.name) {
                modal.cfg.name = generateSlug(2);
            }
            resolve(modal.cfg);
        };
        try {
            modal.open();
        } catch (error) {
            console.log("Caught %o, rejecting promise", error);
            Promise.reject();
        }
    });
}

class CreateTemplateModal extends Modal {
    cfg: SnippetConfig;
    helper: ModalHelper;
    snippetor: Snippetor;

    constructor(app: App, cfg: SnippetConfig, snippetor: Snippetor) {
        super(app);
        this.snippetor = snippetor;
        this.containerEl.id = "snippetor-checkboxes-modal";
        this.cfg = cfg /* || snippetor.createNew..SnippetCfg() */; // create new initial value?
    }

    onOpen(): void {
        // render panel
    }

    onClose(): void {
        // clean up
    }
}
