import { IDS, SELECTORS } from "../config/selectors.js";
import { makeDraggable } from "../chat/draggable.js";
import { putborder } from "../dom/sidebar-injection.js";

export const coreController = () => {
  const el = document.querySelector(SELECTORS.gemsListContainer);
  const items = document.querySelector(SELECTORS.sideNavEntry);
  const cvs = document.querySelector(SELECTORS.sectionTitle);

  const isUIRendered = document.body.contains(document.getElementById(IDS.folderList));

  if (el && items && cvs && !isUIRendered) {
    putborder();
  }

  makeDraggable();
};
