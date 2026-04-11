import { coreController, scheduleCoreController } from "./core/controller.js";
import { loadState } from "./state/store.js";

(function () {
  "use strict";

  loadState(() => {
    setInterval(scheduleCoreController, 800);

    const observer = new MutationObserver(scheduleCoreController);
    observer.observe(document.body, { childList: true, subtree: true });

    coreController();
  });
})();
