import type {
    FolderSnippetConfig,
    SnippetorSettings,
    TaskSnippetConfig,
} from "./@types";

export const LOCK = "lock";
export const LOCK_ICON =
    '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 330 330" fill="currentColor" xml:space="preserve"><g id="XMLID_504_"><path id="XMLID_505_" d="M65,330h200c8.284,0,15-6.716,15-15V145c0-8.284-6.716-15-15-15h-15V85c0-46.869-38.131-85-85-85S80,38.131,80,85v45H65c-8.284,0-15,6.716-15,15v170C50,323.284,56.716,330,65,330z M207.481,219.356l-42.5,42.5c-2.929,2.929-6.768,4.394-10.606,4.394s-7.678-1.465-10.606-4.394l-21.25-21.25c-5.858-5.858-5.858-15.354,0-21.213c5.857-5.858,15.355-5.858,21.213,0l10.644,10.643l31.894-31.893c5.857-5.858,15.355-5.858,21.213,0C213.34,204.002,213.34,213.498,207.481,219.356z M110,85c0-30.327,24.673-55,55-55s55,24.673,55,55v45H110V85z"/></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g></svg>';

export const UNLOCK = "unlock";
export const UNLOCK_ICON =
    '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"	 viewBox="0 0 330 330" fill="currentColor" xml:space="preserve"><g id="XMLID_516_">	<path id="XMLID_517_" d="M15,160c8.284,0,15-6.716,15-15V85c0-30.327,24.673-55,55-55c30.327,0,55,24.673,55,55v45h-25		c-8.284,0-15,6.716-15,15v170c0,8.284,6.716,15,15,15h200c8.284,0,15-6.716,15-15V145c0-8.284-6.716-15-15-15H170V85		c0-46.869-38.131-85-85-85S0,38.131,0,85v60C0,153.284,6.716,160,15,160z"/></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g></svg>';

export const DEFAULT_SETTINGS: SnippetorSettings = {
    snippets: {},
};

export const DEFAULT_TASK_SNIPPET_SETTINGS: Partial<TaskSnippetConfig> = {
    type: "simple-task",
    taskSettings: [],
};

export const DEFAULT_FOLDER_SNIPPET_SETTINGS: Partial<FolderSnippetConfig> = {
    type: "folder",
    folders: [],
    borderRadius: 6,
    hoverDecoration: true,
    folderIcon: true,
    hideCollapse: false,
    hideScrollbar: true,
    hideTypes: true,
    relationshipLines: true,
    default: {
        cache: {
            folderEl: null,
            titleEl: null,
        },
        target: "",
        lightMode: {
            foreground: "var(--text-normal)",
            background: "transparent",
        },
        darkMode: {
            foreground: "var(--text-normal)",
            background: "transparent",
        },
        includeChildren: false,
    },
};

export enum COLOR {
    FOREGROUND = "FG",
    BACKGROUND = "BG",
}
