import { coreController } from "./core/controller.js";
import { loadState } from "./state/store.js";

(function () {
  "use strict";

  loadState(() => {
    setInterval(coreController, 800);

    const observer = new MutationObserver(coreController);
    observer.observe(document.body, { childList: true, subtree: true });

    coreController();
  });
})();
