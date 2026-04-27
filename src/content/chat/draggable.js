import { runtime } from "../state/runtime.js";
import { getAppState } from "../state/store.js";
import { applyChatDropToFolder } from "../ui/folder-ui.js";
import { SELECTORS } from "../config/selectors.js";

let activeDragPreview = null;
let activeDragState = null;
let hoveredFolder = null;
let suppressNextClick = false;
const DRAG_OFFSET_X = 18;
const DRAG_OFFSET_Y = 18;
const DRAG_START_THRESHOLD_PX = 5;
let dragListenersAttached = false;

const removeActiveDragPreview = () => {
  if (activeDragPreview && activeDragPreview.parentNode) {
    activeDragPreview.parentNode.removeChild(activeDragPreview);
  }

  activeDragPreview = null;
};

const clearHoveredFolderHighlight = () => {
  if (hoveredFolder) {
    hoveredFolder.style.backgroundColor = "transparent";
    hoveredFolder = null;
  }
};

const setHoveredFolder = (folderNode) => {
  if (hoveredFolder === folderNode) return;

  clearHoveredFolderHighlight();

  if (folderNode) {
    hoveredFolder = folderNode;
    hoveredFolder.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
  }
};

const resetDraggedChatStyles = (chat) => {
  if (!chat) return;

  chat.style.opacity = "1";
  chat.style.transform = "";
  chat.style.boxShadow = "";
  chat.style.backgroundColor = "";
  chat.style.cursor = "grab";
  chat.style.userSelect = "";
};

const setDraggedChatStyles = (chat) => {
  if (!chat) return;

  chat.style.opacity = "0.72";
  chat.style.transform = "scale(1.02)";
  chat.style.boxShadow = "0 12px 28px rgba(0, 0, 0, 0.28)";
  chat.style.backgroundColor = "rgba(255, 255, 255, 0.06)";
  chat.style.cursor = "grab";
  chat.style.userSelect = "none";
};

const makePreviewFromChat = (chat) => {
  const preview = chat.cloneNode(true);
  preview.style.position = "fixed";
  preview.style.top = "0px";
  preview.style.left = "0px";
  preview.style.width = `${Math.max(chat.getBoundingClientRect().width, 260)}px`;
  preview.style.maxWidth = "360px";
  preview.style.padding = "8px 12px";
  preview.style.borderRadius = "14px";
  preview.style.background = "rgba(32, 33, 36, 0.96)";
  preview.style.backdropFilter = "blur(10px)";
  preview.style.boxShadow = "0 18px 40px rgba(0, 0, 0, 0.32)";
  preview.style.border = "1px solid rgba(255, 255, 255, 0.08)";
  preview.style.pointerEvents = "none";
  preview.style.cursor = "grab";
  preview.style.zIndex = "2147483647";
  preview.style.opacity = "1";

  const anchor = preview.querySelector("a");
  if (anchor) {
    anchor.style.color = "inherit";
    anchor.style.textDecoration = "none";
    anchor.style.cursor = "inherit";
    anchor.style.pointerEvents = "none";
    anchor.style.font = "inherit";
    anchor.style.lineHeight = "inherit";
  }

  const titleNode = preview.querySelector(".title-container");
  if (titleNode) {
    titleNode.style.color = "#e3e3e3";
  }

  const iconNode = preview.querySelector(".mat-icon");
  if (iconNode) {
    iconNode.style.color = "#c4c7c5";
  }

  return preview;
};

const positionDragPreview = (preview, clientX, clientY) => {
  if (!preview) return;

  preview.style.transform = `translate(${Math.round(clientX + DRAG_OFFSET_X)}px, ${Math.round(clientY + DRAG_OFFSET_Y)}px)`;
};

const getFolderFromPoint = (clientX, clientY) => {
  const element = document.elementFromPoint(clientX, clientY);
  return element ? element.closest(".folder-item") : null;
};

const applyDropAtPoint = (clientX, clientY) => {
  if (!activeDragState) return;

  const initialFolderId = activeDragState.initialFolderId;
  const targetFolder = getFolderFromPoint(clientX, clientY);
  if (targetFolder) {
    applyChatDropToFolder(activeDragState.chatData, targetFolder);
  }

  if (activeDragState.chat) {
    resetDraggedChatStyles(activeDragState.chat);
  }

  if (initialFolderId) {
    const parentFolder = document.getElementById(initialFolderId);
    if (parentFolder) {
      const currentIcon = parentFolder.querySelector(".mat-icon");
      if (currentIcon) {
        currentIcon.textContent = parentFolder.isOpen ? "folder_open" : "folder";
        currentIcon.style.color = "";
      }
    }
  }

  runtime.currentDraggedChat = null;
  activeDragState = null;
  removeActiveDragPreview();
  clearHoveredFolderHighlight();
  document.body.style.userSelect = "";
  suppressNextClick = true;
  setTimeout(() => {
    suppressNextClick = false;
  }, 0);
};

const cancelActiveDrag = () => {
  if (!activeDragState) return;

  if (activeDragState.initialFolderId) {
    const parentFolder = document.getElementById(activeDragState.initialFolderId);
    if (parentFolder) {
      const currentIcon = parentFolder.querySelector(".mat-icon");
      if (currentIcon) {
        currentIcon.textContent = parentFolder.isOpen ? "folder_open" : "folder";
        currentIcon.style.color = "";
      }
    }
  }

  if (activeDragState.chat) {
    resetDraggedChatStyles(activeDragState.chat);
  }

  runtime.currentDraggedChat = null;
  activeDragState = null;
  removeActiveDragPreview();
  clearHoveredFolderHighlight();
  document.body.style.userSelect = "";
};

const disableLinkDragGhost = (chat) => {
  chat.querySelectorAll("a").forEach((anchor) => {
    anchor.draggable = false;
    anchor.addEventListener(
      "dragstart",
      (event) => {
        event.preventDefault();
        event.stopPropagation();
      },
      true
    );
  });
};

const handlePointerMove = (event) => {
  if (!activeDragState || event.pointerId !== activeDragState.pointerId) return;

  const deltaX = event.clientX - activeDragState.startX;
  const deltaY = event.clientY - activeDragState.startY;

  if (!activeDragState.isDragging) {
    if ((deltaX * deltaX) + (deltaY * deltaY) < DRAG_START_THRESHOLD_PX * DRAG_START_THRESHOLD_PX) {
      return;
    }

    activeDragState.isDragging = true;
    activeDragState.chat.setPointerCapture?.(event.pointerId);
    setDraggedChatStyles(activeDragState.chat);

    const dragPreview = makePreviewFromChat(activeDragState.chat);
    document.body.appendChild(dragPreview);
    activeDragPreview = dragPreview;
    positionDragPreview(activeDragPreview, event.clientX, event.clientY);
    document.body.style.userSelect = "none";
  }

  if (!activeDragPreview) return;

  event.preventDefault();
  positionDragPreview(activeDragPreview, event.clientX, event.clientY);
  setHoveredFolder(getFolderFromPoint(event.clientX, event.clientY));
};

const handlePointerUp = (event) => {
  if (!activeDragState || event.pointerId !== activeDragState.pointerId) return;

  if (activeDragState.isDragging) {
    applyDropAtPoint(event.clientX, event.clientY);
  } else {
    cancelActiveDrag();
  }
};

const handlePointerCancel = (event) => {
  if (!activeDragState || event.pointerId !== activeDragState.pointerId) return;

  cancelActiveDrag();
};

export const makeDraggable = () => {
  const appState = getAppState();
  const chats = document.querySelectorAll(SELECTORS.conversationItem);

  if (!dragListenersAttached) {
    document.addEventListener("pointermove", handlePointerMove, true);
    document.addEventListener("pointerup", handlePointerUp, true);
    document.addEventListener("pointercancel", handlePointerCancel, true);
    dragListenersAttached = true;
  }

  chats.forEach((chat) => {
    if (chat.dataset.gfConfigured === "1") return;

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

    chat.dataset.gfConfigured = "1";
    chat.style.cursor = "grab";
    chat.style.transition = "transform 120ms ease, box-shadow 120ms ease, opacity 120ms ease, background-color 120ms ease";
    disableLinkDragGhost(chat);

    chat.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      if (event.target && event.target.closest && event.target.closest(".mat-icon")) return;

      const linkElement = chat.querySelector("a");
      const titleElement = chat.querySelector(".title-container") || chat;

      activeDragState = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        chat,
        chatData: {
          id: chat.id,
          url: linkElement ? linkElement.href : "",
          title: titleElement.textContent.trim()
        },
        initialFolderId: chat.dataset.folder || null,
        isDragging: false
      };

      runtime.currentDraggedChat = chat;
      document.body.style.userSelect = "none";

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

    chat.addEventListener("click", (event) => {
      if (!suppressNextClick) return;

      event.preventDefault();
      event.stopPropagation();
      suppressNextClick = false;
    });
  });
};
