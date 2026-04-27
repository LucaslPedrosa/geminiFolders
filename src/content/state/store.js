import { SELECTORS } from "../config/selectors.js";
import { migrateLegacyChatMappings } from "./migrations.js";
import { refreshAllFolderCounts } from "../ui/folder-ui.js";

let appState = { folders: [], chatMappings: {} };

export const getAppState = () => appState;

export const setAppState = (state) => {
  appState = state;
};

export const saveState = () => {
  if (!appState.chatMappings) appState.chatMappings = {};
  const state = { folders: [], chatMappings: appState.chatMappings };
  const folderIds = new Set();

  document.querySelectorAll(SELECTORS.folderItem).forEach((folderNode) => {
    const titleNode = folderNode.querySelector(SELECTORS.titleContainer);
    const cleanedName = (titleNode ? titleNode.textContent : "").trim();

    folderIds.add(folderNode.id);
    state.folders.push({
      id: folderNode.id,
      name: cleanedName.length > 0 ? cleanedName : "Untitled"
    });
  });

  for (const chatId of Object.keys(state.chatMappings)) {
    const mapping = state.chatMappings[chatId];
    if (!mapping || !mapping.folder || !folderIds.has(mapping.folder)) {
      delete state.chatMappings[chatId];
    }
  }

  appState = state;
  chrome.storage.local.set({ gemini_folders_state: state }, () => {
    void chrome.runtime?.lastError;
  });
  refreshAllFolderCounts();
};

export const loadState = (onLoaded) => {
  chrome.storage.local.get(["gemini_folders_state"], (result) => {
    void chrome.runtime?.lastError;

    if (result.gemini_folders_state) {
      appState = result.gemini_folders_state;
      if (!appState.chatMappings) appState.chatMappings = {};
      if (!appState.folders) appState.folders = [];

      const didMigrate = migrateLegacyChatMappings(appState);
      if (didMigrate) {
        chrome.storage.local.set({ gemini_folders_state: appState }, () => {
          void chrome.runtime?.lastError;
        });
      }
    }

    onLoaded();
  });
};
