import { runtime } from "../state/runtime.js";
import { getAppState, saveState } from "../state/store.js";
import { renderVirtualChats } from "./virtual-chats.js";

export const createFolderUI = (id, name, folderSkeleton) => {
  const newFolder = folderSkeleton.cloneNode(true);
  newFolder.id = id;
  newFolder.isOpen = false;
  newFolder.classList.add("folder-item");
  newFolder.style.position = "relative";
  newFolder.style.transition = "background-color 0.2s";

  const titleNode = newFolder.querySelector(".title-container");
  titleNode.textContent = name;
  titleNode.style.paddingRight = "30px";
  titleNode.style.overflow = "hidden";
  titleNode.style.textOverflow = "ellipsis";
  titleNode.style.whiteSpace = "nowrap";

  const iconElement = newFolder.querySelector(".mat-icon");
  if (iconElement) iconElement.textContent = "folder";

  const deleteBtn = document.createElement("span");
  deleteBtn.className = "mat-icon notranslate google-symbols mat-ligature-font";
  deleteBtn.textContent = "delete";
  deleteBtn.style.position = "absolute";
  deleteBtn.style.right = "8px";
  deleteBtn.style.top = "50%";
  deleteBtn.style.transform = "translateY(-50%)";
  deleteBtn.style.fontSize = "18px";
  deleteBtn.style.color = "#c4c7c5";
  deleteBtn.style.opacity = "0";
  deleteBtn.style.transition = "all 0.2s";
  deleteBtn.style.zIndex = "10";
  deleteBtn.style.display = "flex";
  deleteBtn.style.alignItems = "center";
  deleteBtn.style.justifyContent = "center";
  deleteBtn.style.width = "28px";
  deleteBtn.style.height = "28px";
  deleteBtn.style.borderRadius = "50%";

  newFolder.appendChild(deleteBtn);

  newFolder.addEventListener("mouseenter", () => {
    deleteBtn.style.opacity = "1";
  });
  newFolder.addEventListener("mouseleave", () => {
    deleteBtn.style.opacity = "0";
  });

  deleteBtn.addEventListener("mouseenter", () => {
    deleteBtn.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
    deleteBtn.style.color = "#ff5c5c";
  });

  deleteBtn.addEventListener("mouseleave", () => {
    deleteBtn.style.backgroundColor = "transparent";
    deleteBtn.style.color = "#c4c7c5";
  });

  deleteBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    document.querySelectorAll(".conversation-items-container").forEach((chat) => {
      if (chat.dataset.folder === newFolder.id) {
        delete chat.dataset.folder;
        chat.style.display = "flex";
      }
    });

    const appState = getAppState();
    for (const chatId in appState.chatMappings) {
      if (appState.chatMappings[chatId] && appState.chatMappings[chatId].folder === newFolder.id) {
        delete appState.chatMappings[chatId];
      }
    }

    if (runtime.openFolder === newFolder) runtime.openFolder = null;
    newFolder.remove();
    saveState();
  });

  let clickTimer = null;

  titleNode.addEventListener("dblclick", (e) => {
    e.stopPropagation();
    clearTimeout(clickTimer);

    titleNode.contentEditable = true;
    titleNode.focus();
    titleNode.style.outline = "1px solid white";
    titleNode.style.paddingRight = "5px";
    titleNode.style.cursor = "text";

    const finishEdit = () => {
      titleNode.contentEditable = false;
      titleNode.style.outline = "none";
      titleNode.style.paddingRight = "30px";
      titleNode.style.cursor = "pointer";
      saveState();
    };

    titleNode.addEventListener("blur", finishEdit, { once: true });
    titleNode.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        finishEdit();
      }
    });
  });

  newFolder.addEventListener("dragover", (e) => {
    e.preventDefault();
    newFolder.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
  });

  newFolder.addEventListener("dragleave", () => {
    newFolder.style.backgroundColor = "transparent";
  });

  newFolder.addEventListener("drop", (e) => {
    e.preventDefault();
    newFolder.style.backgroundColor = "transparent";

    const chatDataString = e.dataTransfer.getData("text/plain");
    if (!chatDataString) return;

    let chatData;
    try {
      chatData = JSON.parse(chatDataString);
    } catch {
      return;
    }

    const appState = getAppState();
    const chatElement = document.getElementById(chatData.id);

    if (chatElement) {
      if (chatElement.dataset.folder === newFolder.id) {
        delete chatElement.dataset.folder;
        delete appState.chatMappings[chatData.id];
        chatElement.style.display = "none";
      } else {
        chatElement.dataset.folder = newFolder.id;
        appState.chatMappings[chatData.id] = {
          folder: newFolder.id,
          title: chatData.title,
          url: chatData.url
        };
        chatElement.style.display = newFolder.isOpen ? "flex" : "none";
      }
    } else {
      appState.chatMappings[chatData.id] = {
        folder: newFolder.id,
        title: chatData.title,
        url: chatData.url
      };
    }

    saveState();

    if (newFolder.isOpen) {
      renderVirtualChats(newFolder);
    }
  });

  newFolder.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (titleNode.contentEditable === "true") return;

    if (e.detail === 1) {
      clickTimer = setTimeout(() => {
        newFolder.isOpen = !newFolder.isOpen;
        iconElement.textContent = newFolder.isOpen ? "folder_open" : "folder";

        if (newFolder.isOpen && runtime.openFolder && runtime.openFolder !== newFolder) {
          runtime.openFolder.isOpen = false;
          const oldIcon = runtime.openFolder.querySelector(".mat-icon");
          if (oldIcon) oldIcon.textContent = "folder";
          const oldContainer = runtime.openFolder.querySelector(".virtual-chat-container");
          if (oldContainer) oldContainer.style.display = "none";
        }
        runtime.openFolder = newFolder.isOpen ? newFolder : null;

        renderVirtualChats(newFolder);

        document.querySelectorAll(".conversation-items-container").forEach((chat) => {
          if (newFolder.isOpen) {
            if (chat.dataset.folder !== newFolder.id) {
              chat.style.display = "none";
            }
          } else {
            chat.style.display = chat.dataset.folder ? "none" : "flex";
          }
        });
      }, 200);
    }
  });

  return newFolder;
};
