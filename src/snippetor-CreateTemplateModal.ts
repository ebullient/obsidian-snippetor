import { App, Modal } from "obsidian";
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

    finish(): void {
        // clean up; Make sure required settings exist

        this.snippetor.initCommonConfig(this.cfg); // name + id + version
    }
}
