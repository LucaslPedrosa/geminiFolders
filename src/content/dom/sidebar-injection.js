import { IDS, SELECTORS } from "../config/selectors.js";
import { getAppState, saveState } from "../state/store.js";
import { createFolderUI } from "../ui/folder-ui.js";

export const putborder = () => {
  const el = document.querySelector(SELECTORS.gemsListContainer);
  const items = document.querySelector(SELECTORS.sideNavEntry);
  const cvs = document.querySelector(SELECTORS.sectionTitle);

  if (!el || !items || !cvs) return;

  const existingList = document.getElementById(IDS.folderList);
  if (existingList) existingList.remove();

  const existingBtn = document.getElementById(IDS.newFolderButton);
  if (existingBtn) existingBtn.remove();

  const btnNewFolder = items.cloneNode(true);
  btnNewFolder.id = IDS.newFolderButton;
  btnNewFolder.querySelector(".title-container").textContent = "New folder";

  const iconContainer = btnNewFolder.querySelector(".mat-icon").parentElement;
  iconContainer.textContent = "";

  const icon = document.createElement("span");
  icon.className = "mat-icon notranslate google-symbols mat-ligature-font material-icons-outlined";
  icon.textContent = "create_new_folder";
  iconContainer.appendChild(icon);

  const folderSkeleton = btnNewFolder.cloneNode(true);
  folderSkeleton.removeAttribute("id");

  const folderSpace = cvs.cloneNode(true);
  folderSpace.querySelector("h1").textContent = "Folders";

  const folderList = document.createElement("div");
  folderList.id = IDS.folderList;
  folderSpace.appendChild(folderList);

  const appState = getAppState();
  if (appState.folders) {
    appState.folders.forEach((folder) => {
      const restored = createFolderUI(folder.id, folder.name, folderSkeleton);
      folderList.appendChild(restored);
    });
  }

  btnNewFolder.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const id = "folder-" + Math.random().toString(36).substr(2, 9);
    const newFolder = createFolderUI(id, "New Folder", folderSkeleton);
    folderList.appendChild(newFolder);
    saveState();
  });

  el.insertAdjacentElement("beforebegin", btnNewFolder);
  el.insertAdjacentElement("afterend", folderSpace);
};
