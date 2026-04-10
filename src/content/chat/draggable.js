import { runtime } from "../state/runtime.js";
import { getAppState } from "../state/store.js";

export const makeDraggable = () => {
  const appState = getAppState();
  const chats = document.querySelectorAll(".conversation-items-container");

  chats.forEach((chat) => {
    if (chat.config) return;

    if (!chat.id) {
      const link = chat.querySelector("a");
      if (link && link.href) {
        const match = link.href.match(/\/app\/([a-z0-9]+)/);
        chat.id = match ? "chat-" + match[1] : "chat-" + btoa(link.href).substring(0, 15);
      } else {
        return;
      }
    }

    if (appState.chatMappings[chat.id] && appState.chatMappings[chat.id].folder) {
      chat.dataset.folder = appState.chatMappings[chat.id].folder;
    }

    if (runtime.openFolder) {
      chat.style.display = chat.dataset.folder === runtime.openFolder.id ? "flex" : "none";
    } else {
      chat.style.display = chat.dataset.folder ? "none" : "flex";
    }

    chat.draggable = true;
    chat.config = true;

    chat.addEventListener("dragstart", (e) => {
      chat.style.opacity = "0.4";

      const linkElement = chat.querySelector("a");
      const titleElement = chat.querySelector(".title-container") || chat;

      const chatData = {
        id: chat.id,
        url: linkElement ? linkElement.href : "",
        title: titleElement.textContent.trim()
      };

      e.dataTransfer.setData("text/plain", JSON.stringify(chatData));
      runtime.currentDraggedChat = chat;

      if (chat.dataset.folder) {
        const parentFolder = document.getElementById(chat.dataset.folder);
        if (parentFolder) {
          const currentIcon = parentFolder.querySelector(".mat-icon");
          if (currentIcon) {
            currentIcon.textContent = "close";
            currentIcon.style.color = "#ff5c5c";
          }
        }
      }
    });

    chat.addEventListener("dragend", () => {
      chat.style.opacity = "1";

      if (runtime.currentDraggedChat && runtime.currentDraggedChat.dataset.folder) {
        const parentFolder = document.getElementById(runtime.currentDraggedChat.dataset.folder);
        if (parentFolder) {
          const currentIcon = parentFolder.querySelector(".mat-icon");
          if (currentIcon) {
            currentIcon.textContent = parentFolder.isOpen ? "folder_open" : "folder";
            currentIcon.style.color = "";
          }
        }
      }
      runtime.currentDraggedChat = null;
    });
  });
};
