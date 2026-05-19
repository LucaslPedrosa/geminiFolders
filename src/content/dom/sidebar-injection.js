import { IDS, SELECTORS } from "../config/selectors.js";
import { getAppState, saveState } from "../state/store.js";
import { createFolderUI } from "../ui/folder-ui.js";

const createSidebarEntry = (label, iconName) => {
  const entry = document.createElement("div");
  entry.className = "side-nav-entry-container gf-sidebar-entry";
  entry.setAttribute("role", "button");
  entry.tabIndex = 0;
  entry.style.display = "flex";
  entry.style.alignItems = "center";
  entry.style.gap = "12px";
  entry.style.minHeight = "40px";
  entry.style.padding = "0 16px";
  entry.style.margin = "0 8px";
  entry.style.borderRadius = "999px";
  entry.style.boxSizing = "border-box";
  entry.style.cursor = "pointer";
  entry.style.color = "inherit";
  entry.style.fontFamily = '"Google Sans", "Google Sans Text", Roboto, Arial, sans-serif';
  entry.style.userSelect = "none";

  const iconContainer = document.createElement("span");
  iconContainer.style.display = "inline-flex";
  iconContainer.style.alignItems = "center";
  iconContainer.style.justifyContent = "center";
  iconContainer.style.width = "24px";
  iconContainer.style.height = "24px";
  iconContainer.style.flex = "0 0 auto";

  const icon = document.createElement("span");
  icon.className = "mat-icon notranslate google-symbols mat-ligature-font material-icons-outlined";
  icon.textContent = iconName;
  icon.style.fontSize = "20px";
  icon.style.lineHeight = "1";

  const title = document.createElement("span");
  title.className = "title-container";
  title.textContent = label;
  title.style.overflow = "hidden";
  title.style.textOverflow = "ellipsis";
  title.style.whiteSpace = "nowrap";
  title.style.fontSize = "14px";
  title.style.lineHeight = "20px";

  iconContainer.appendChild(icon);
  entry.appendChild(iconContainer);
  entry.appendChild(title);

  entry.addEventListener("mouseenter", () => {
    entry.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
  });
  entry.addEventListener("mouseleave", () => {
    entry.style.backgroundColor = "transparent";
  });

  return entry;
};

const createNewFolderButton = (sourceEntry) => {
  const btnNewFolder = sourceEntry ? sourceEntry.cloneNode(true) : createSidebarEntry("New folder", "create_new_folder");
  btnNewFolder.id = IDS.newFolderButton;
  btnNewFolder.classList.add("gf-new-folder-button");

  const titleNode = btnNewFolder.querySelector(".title-container") || btnNewFolder.querySelector(SELECTORS.titleContainer);
  if (titleNode) titleNode.textContent = "New folder";

  const iconHost = btnNewFolder.querySelector(".mat-icon");
  if (iconHost) {
    iconHost.textContent = "create_new_folder";
  }

  return btnNewFolder;
};

const findFolderInsertionPoint = () => {
  const gemsList = document.querySelector(SELECTORS.gemsListContainer);
  if (gemsList && gemsList.parentNode) {
    return { parent: gemsList.parentNode, before: gemsList };
  }

  const firstConversation = document.querySelector(SELECTORS.conversationItem);
  if (firstConversation && firstConversation.parentNode) {
    return { parent: firstConversation.parentNode, before: firstConversation };
  }

  return null;
};

const removeExistingFolderUi = () => {
  const existingSpace = document.getElementById(IDS.folderSpace);
  const existingList = document.getElementById(IDS.folderList);
  const existingBtn = document.getElementById(IDS.newFolderButton);

  if (existingBtn && existingBtn.parentNode) existingBtn.parentNode.removeChild(existingBtn);
  if (existingSpace && existingSpace.parentNode) {
    existingSpace.parentNode.removeChild(existingSpace);
  } else if (existingList && existingList.parentNode) {
    existingList.parentNode.removeChild(existingList);
  }
};

export const putborder = () => {
  const insertionPoint = findFolderInsertionPoint();
  if (!insertionPoint) return false;

  try {
    const sourceEntry = document.querySelector(SELECTORS.sideNavEntry);
    const btnNewFolder = createNewFolderButton(sourceEntry);
    const folderSkeleton = createSidebarEntry("Folder", "folder");

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

    const emptyState = document.createElement("div");
    emptyState.className = "gf-empty-folder-state";
    emptyState.textContent = "No folders yet";
    emptyState.style.padding = "8px 16px 4px 16px";
    emptyState.style.fontSize = "13px";
    emptyState.style.opacity = "0.7";

    const appState = getAppState();
    if (appState.folders && appState.folders.length > 0) {
      appState.folders.forEach((folder) => {
        const restored = createFolderUI(folder.id, folder.name, folderSkeleton);
        folderList.appendChild(restored);
      });
    } else {
      folderList.appendChild(emptyState);
    }

    btnNewFolder.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const currentEmptyState = folderList.querySelector(".gf-empty-folder-state");
      if (currentEmptyState) currentEmptyState.remove();

      const id = typeof crypto !== "undefined" && crypto.randomUUID ? `folder-${crypto.randomUUID()}` : "folder-" + Math.random().toString(36).slice(2, 11);
      const newFolder = createFolderUI(id, "New Folder", folderSkeleton);
      folderList.appendChild(newFolder);
      saveState();
    });

    removeExistingFolderUi();
    insertionPoint.parent.insertBefore(btnNewFolder, insertionPoint.before);
    insertionPoint.parent.insertBefore(folderSpace, insertionPoint.before);
    return true;
  } catch {
    return false;
  }
};
