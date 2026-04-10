import { SELECTORS } from "../config/selectors.js";
import { migrateLegacyChatMappings } from "./migrations.js";

let appState = { folders: [], chatMappings: {} };

export const getAppState = () => appState;

export const setAppState = (state) => {
  appState = state;
};

export const saveState = () => {
  const state = { folders: [], chatMappings: appState.chatMappings };

  document.querySelectorAll(SELECTORS.folderItem).forEach((folderNode) => {
    const titleNode = folderNode.querySelector(SELECTORS.titleContainer);
    state.folders.push({
      id: folderNode.id,
      name: titleNode ? titleNode.textContent : ""
    });
  });

  appState = state;
  chrome.storage.local.set({ gemini_folders_state: state });
};

export const loadState = (onLoaded) => {
  chrome.storage.local.get(["gemini_folders_state"], (result) => {
    if (result.gemini_folders_state) {
      appState = result.gemini_folders_state;
      if (!appState.chatMappings) appState.chatMappings = {};
      if (!appState.folders) appState.folders = [];
      migrateLegacyChatMappings(appState);
    }

    onLoaded();
  });
};
