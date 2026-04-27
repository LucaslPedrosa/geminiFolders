import { IDS, SELECTORS } from "../config/selectors.js";
import { makeDraggable } from "../chat/draggable.js";
import { putborder } from "../dom/sidebar-injection.js";
import { runtime } from "../state/runtime.js";

let controllerQueued = false;
let controllerRetryTimer = null;
let controllerThrottleTimer = null;
let lastControllerRunAt = 0;

const MIN_CONTROLLER_INTERVAL_MS = 200;

export const scheduleCoreController = () => {
  if (controllerQueued) return;

  const now = performance.now();
  const elapsed = now - lastControllerRunAt;
  if (elapsed < MIN_CONTROLLER_INTERVAL_MS) {
    if (controllerThrottleTimer) return;
    controllerThrottleTimer = setTimeout(() => {
      controllerThrottleTimer = null;
      scheduleCoreController();
    }, MIN_CONTROLLER_INTERVAL_MS - elapsed);
    return;
  }

  controllerQueued = true;
  requestAnimationFrame(() => {
    controllerQueued = false;
    lastControllerRunAt = performance.now();
    coreController();
  });
};

export const coreController = () => {
  const el = document.querySelector(SELECTORS.gemsListContainer);
  const items = document.querySelector(SELECTORS.sideNavEntry);
  const cvs = document.querySelector(SELECTORS.sectionTitle);

  if (runtime.openFolder && !document.body.contains(runtime.openFolder)) {
    runtime.openFolder = null;
  }

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
