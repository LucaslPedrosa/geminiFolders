import { IDS, SELECTORS } from "../config/selectors.js";
import { makeDraggable } from "../chat/draggable.js";
import { putborder } from "../dom/sidebar-injection.js";

let controllerQueued = false;
let controllerRetryTimer = null;

export const scheduleCoreController = () => {
  if (controllerQueued) return;

  controllerQueued = true;
  requestAnimationFrame(() => {
    controllerQueued = false;
    coreController();
  });
};

export const coreController = () => {
  const el = document.querySelector(SELECTORS.gemsListContainer);
  const items = document.querySelector(SELECTORS.sideNavEntry);
  const cvs = document.querySelector(SELECTORS.sectionTitle);

  const folderSpace = document.getElementById(IDS.folderSpace);
  const folderList = document.getElementById(IDS.folderList);
  const isUIRendered = Boolean(folderSpace && folderList && document.body.contains(folderSpace) && document.body.contains(folderList));

  if (el && items && cvs && !isUIRendered) {
    putborder();
  } else if (!el || !items || !cvs) {
    if (controllerRetryTimer) clearTimeout(controllerRetryTimer);
    controllerRetryTimer = setTimeout(() => {
      controllerRetryTimer = null;
      scheduleCoreController();
    }, 250);
  }

  makeDraggable();
};
