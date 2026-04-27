import { coreController, scheduleCoreController } from "./core/controller.js";
import { loadState } from "./state/store.js";

(function () {
  "use strict";

  const GLOBAL_KEY = "__GEMINI_FOLDERS__";
  const existing = globalThis[GLOBAL_KEY];
  if (existing && existing.initialized) return;
  globalThis[GLOBAL_KEY] = { initialized: true };

  loadState(() => {
    const intervalId = setInterval(scheduleCoreController, 1500);

    const observer = new MutationObserver(scheduleCoreController);
    observer.observe(document.body, { childList: true, subtree: true });

    globalThis[GLOBAL_KEY].intervalId = intervalId;
    globalThis[GLOBAL_KEY].observer = observer;

    coreController();
  });
})();
