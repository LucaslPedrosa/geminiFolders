import { IDS, SELECTORS } from "../config/selectors.js";
import { getAppState, saveState } from "../state/store.js";
import { createFolderUI } from "../ui/folder-ui.js";

export const putborder = () => {
  const el = document.querySelector(SELECTORS.gemsListContainer);
  const items = document.querySelector(SELECTORS.sideNavEntry);

  if (!el || !items) return;

  try {
    const existingSpace = document.getElementById(IDS.folderSpace);
    const btnNewFolder = items.cloneNode(true);
    btnNewFolder.id = IDS.newFolderButton;

    const titleNode = btnNewFolder.querySelector(".title-container");
    if (!titleNode) return;
    titleNode.textContent = "New folder";

    const iconHost = btnNewFolder.querySelector(".mat-icon");
    if (!iconHost || !iconHost.parentElement) return;

    const iconContainer = iconHost.parentElement;
    iconContainer.textContent = "";

    const icon = document.createElement("span");
    icon.className = "mat-icon notranslate google-symbols mat-ligature-font material-icons-outlined";
    icon.textContent = "create_new_folder";
    iconContainer.appendChild(icon);

    const folderSkeleton = btnNewFolder.cloneNode(true);
    folderSkeleton.removeAttribute("id");

    const folderSpace = document.createElement("section");
    folderSpace.id = IDS.folderSpace;
    folderSpace.className = "folder-space";
    folderSpace.style.display = "flex";
    folderSpace.style.flexDirection = "column";
    folderSpace.style.gap = "8px";
    folderSpace.style.padding = "8px 0";
    folderSpace.style.minHeight = "56px";
    folderSpace.style.boxSizing = "border-box";

    const folderTitleRow = document.createElement("div");
    folderTitleRow.style.display = "flex";
    folderTitleRow.style.alignItems = "center";
    folderTitleRow.style.padding = "0 16px";
    folderTitleRow.style.minHeight = "32px";

    const folderTitle = document.createElement("h1");
    folderTitle.textContent = "Folders";
    folderTitle.style.margin = "0";
    folderTitle.style.fontSize = "14px";
    folderTitle.style.fontWeight = "600";
    folderTitle.style.letterSpacing = "0.2px";
    folderTitle.style.fontFamily = '"Google Sans", "Google Sans Text", "Roboto", Arial, sans-serif';
    folderTitle.style.lineHeight = "20px";
    folderTitle.style.color = "inherit";

    folderTitleRow.appendChild(folderTitle);
    folderSpace.appendChild(folderTitleRow);

    const folderList = document.createElement("div");
    folderList.id = IDS.folderList;
    folderList.style.display = "flex";
    folderList.style.flexDirection = "column";
    folderList.style.gap = "4px";
    folderList.style.minHeight = "1px";
    folderList.style.padding = "0 8px 8px 8px";
    folderSpace.appendChild(folderList);

    const appState = getAppState();
    if (appState.folders && appState.folders.length > 0) {
      appState.folders.forEach((folder) => {
        const restored = createFolderUI(folder.id, folder.name, folderSkeleton);
        folderList.appendChild(restored);
      });
    }

    if (appState.folders && appState.folders.length === 0) {
      const emptyState = document.createElement("div");
      emptyState.textContent = "No folders yet";
      emptyState.style.padding = "8px 16px 4px 16px";
      emptyState.style.fontSize = "13px";
      emptyState.style.opacity = "0.7";
      folderList.appendChild(emptyState);
    }

    btnNewFolder.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = typeof crypto !== "undefined" && crypto.randomUUID ? `folder-${crypto.randomUUID()}` : "folder-" + Math.random().toString(36).slice(2, 11);
      const newFolder = createFolderUI(id, "New Folder", folderSkeleton);
      folderList.appendChild(newFolder);
      saveState();
    });

    const existingList = document.getElementById(IDS.folderList);
    const existingBtn = document.getElementById(IDS.newFolderButton);

    if (existingBtn && existingBtn.parentNode) {
      existingBtn.parentNode.removeChild(existingBtn);
    }
    if (existingSpace && existingSpace.parentNode) {
      existingSpace.parentNode.removeChild(existingSpace);
    } else if (existingList && existingList.parentNode) {
      existingList.parentNode.removeChild(existingList);
    }

    el.insertAdjacentElement("beforebegin", btnNewFolder);
    el.insertAdjacentElement("afterend", folderSpace);
  } catch {
    return;
  }
};
