import { runtime } from "../state/runtime.js";
import { getAppState } from "../state/store.js";

export const renderVirtualChats = (folder) => {
  const appState = getAppState();

  let virtualContainer = folder.querySelector(".virtual-chat-container");
  if (!virtualContainer) {
    virtualContainer = document.createElement("div");
    virtualContainer.className = "virtual-chat-container";
    virtualContainer.style.paddingLeft = "15px";
    virtualContainer.style.display = "none";
    folder.appendChild(virtualContainer);
  }

  virtualContainer.innerHTML = "";
  virtualContainer.style.display = folder.isOpen ? "block" : "none";

  for (const chatId in appState.chatMappings) {
    const chatInfo = appState.chatMappings[chatId];
    if (!chatInfo || chatInfo.folder !== folder.id) continue;

    const domElement = document.getElementById(chatId);

    if (folder.isOpen) {
      if (domElement) {
        domElement.style.display = "flex";
      } else {
        const fakeChat = document.createElement("a");
        fakeChat.href = chatInfo.url;
        fakeChat.textContent = chatInfo.title;
        fakeChat.style.display = "block";
        fakeChat.style.padding = "10px 15px";
        fakeChat.style.color = "#e3e3e3";
        fakeChat.style.textDecoration = "none";
        fakeChat.style.fontSize = "14px";
        fakeChat.style.whiteSpace = "nowrap";
        fakeChat.style.overflow = "hidden";
        fakeChat.style.textOverflow = "ellipsis";
        fakeChat.style.borderRadius = "8px";
        fakeChat.style.marginTop = "2px";

        fakeChat.addEventListener("mouseenter", () => {
          fakeChat.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
        });
        fakeChat.addEventListener("mouseleave", () => {
          fakeChat.style.backgroundColor = "transparent";
        });

        virtualContainer.appendChild(fakeChat);
      }
    } else if (domElement) {
      domElement.style.display = "none";
    }
  }

  if (!folder.isOpen && runtime.openFolder === folder) {
    runtime.openFolder = null;
  }
};
