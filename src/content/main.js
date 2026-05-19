import { coreController, scheduleCoreController } from "./core/controller.js";
import { loadState } from "./state/store.js";
import { IDS, SELECTORS } from "./config/selectors.js";

const EXTENSION_NODE_SELECTORS = [
  `#${IDS.folderList}`,
  `#${IDS.folderSpace}`,
  `#${IDS.newFolderButton}`,
  ".folder-item",
  ".virtual-chat-container",
  ".gf-chat-folder-action"
].join(", ");

const RELEVANT_ADDED_NODE_SELECTORS = [
  SELECTORS.conversationItem,
  SELECTORS.conversationTrailingContent,
  SELECTORS.conversationActionsMenuHost,
  SELECTORS.gemsListContainer,
  SELECTORS.sideNavEntry,
  SELECTORS.sectionTitle
].join(", ");

const hasRelevantAddedNode = (mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (!(node instanceof Element)) continue;
      if (node.matches(EXTENSION_NODE_SELECTORS)) continue;
      if (node.matches(RELEVANT_ADDED_NODE_SELECTORS) || node.querySelector(RELEVANT_ADDED_NODE_SELECTORS)) {
        return true;
      }
    }
  }

  return false;
};

(function () {
  "use strict";

  const GLOBAL_KEY = "__GEMINI_FOLDERS__";
  const existing = globalThis[GLOBAL_KEY];
  if (existing && existing.initialized) return;
  globalThis[GLOBAL_KEY] = { initialized: true };

  loadState(() => {
    const intervalId = setInterval(scheduleCoreController, 1500);

    const observer = new MutationObserver((mutations) => {
      if (hasRelevantAddedNode(mutations)) scheduleCoreController();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    globalThis[GLOBAL_KEY].intervalId = intervalId;
    globalThis[GLOBAL_KEY].observer = observer;

    coreController();
  });
})();
