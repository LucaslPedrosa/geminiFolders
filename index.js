(() => {
  // src/content/config/selectors.js
  var SELECTORS = {
    folderItem: ".folder-item",
    titleContainer: ".title-container",
    conversationItem: ".conversation-items-container",
    sideNavEntry: ".side-nav-entry-container",
    gemsListContainer: ".gems-list-container",
    sectionTitle: ".title-container.ng-trigger"
  };
  var IDS = {
    folderList: "custom-folder-list",
    folderSpace: "custom-folder-space",
    newFolderButton: "custom-new-folder-btn"
  };

  // src/content/state/runtime.js
  var runtime = {
    openFolder: null,
    currentDraggedChat: null
  };

  // src/content/state/migrations.js
  var migrateLegacyChatMappings = (state) => {
    let didMigrate = false;
    for (const key in state.chatMappings) {
      if (typeof state.chatMappings[key] === "string") {
        state.chatMappings[key] = {
          folder: state.chatMappings[key],
          title: "Chat Recuperado",
          url: ""
        };
        didMigrate = true;
      }
    }
    return didMigrate;
  };

  // src/content/ui/virtual-chats.js
  var renderVirtualChats = (folder) => {
    const appState2 = getAppState();
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
    for (const chatId in appState2.chatMappings) {
      const chatInfo = appState2.chatMappings[chatId];
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

  // src/content/ui/folder-ui.js
  var updateFolderChatCount = (folderNode) => {
    const countNode = folderNode.querySelector(".folder-chat-count");
    if (!countNode) return;
    const appState2 = getAppState();
    const folderId = folderNode.id;
    const count = Object.values(appState2.chatMappings || {}).filter((chatInfo) => chatInfo && chatInfo.folder === folderId).length;
    countNode.textContent = String(count);
    countNode.style.display = count > 0 ? "flex" : "none";
  };
  var refreshAllFolderCounts = () => {
    document.querySelectorAll(".folder-item").forEach((folderNode) => {
      updateFolderChatCount(folderNode);
    });
  };
  var applyChatDropToFolder = (chatData, folderNode) => {
    if (!chatData || !folderNode) return;
    const appState2 = getAppState();
    const chatElement = document.getElementById(chatData.id);
    if (!appState2.chatMappings) appState2.chatMappings = {};
    if (chatElement) {
      if (chatElement.dataset.folder === folderNode.id) {
        delete chatElement.dataset.folder;
        delete appState2.chatMappings[chatData.id];
        chatElement.style.display = "none";
      } else {
        chatElement.dataset.folder = folderNode.id;
        appState2.chatMappings[chatData.id] = {
          folder: folderNode.id,
          title: chatData.title,
          url: chatData.url
        };
        chatElement.style.display = folderNode.isOpen ? "flex" : "none";
      }
    } else {
      appState2.chatMappings[chatData.id] = {
        folder: folderNode.id,
        title: chatData.title,
        url: chatData.url
      };
    }
    saveState();
    if (folderNode.isOpen) {
      renderVirtualChats(folderNode);
    }
  };
  var createFolderUI = (id, name, folderSkeleton) => {
    const newFolder = folderSkeleton.cloneNode(true);
    newFolder.id = id;
    newFolder.isOpen = false;
    newFolder.classList.add("folder-item");
    newFolder.style.position = "relative";
    newFolder.style.transition = "background-color 0.2s";
    const titleNode = newFolder.querySelector(".title-container");
    if (!titleNode) return newFolder;
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
    const countNode = document.createElement("span");
    countNode.className = "folder-chat-count";
    countNode.textContent = "0";
    countNode.style.position = "absolute";
    countNode.style.right = "40px";
    countNode.style.top = "50%";
    countNode.style.transform = "translateY(-50%)";
    countNode.style.minWidth = "20px";
    countNode.style.height = "20px";
    countNode.style.padding = "0 6px";
    countNode.style.display = "none";
    countNode.style.alignItems = "center";
    countNode.style.justifyContent = "center";
    countNode.style.borderRadius = "999px";
    countNode.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
    countNode.style.color = "#e3e3e3";
    countNode.style.fontSize = "12px";
    countNode.style.fontWeight = "600";
    countNode.style.lineHeight = "1";
    countNode.style.pointerEvents = "none";
    newFolder.appendChild(countNode);
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
      document.querySelectorAll(SELECTORS.conversationItem).forEach((chat) => {
        if (chat.dataset.folder === newFolder.id) {
          delete chat.dataset.folder;
          chat.style.display = "flex";
        }
      });
      const appState2 = getAppState();
      for (const chatId in appState2.chatMappings) {
        if (appState2.chatMappings[chatId] && appState2.chatMappings[chatId].folder === newFolder.id) {
          delete appState2.chatMappings[chatId];
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
      const previousTitle = titleNode.textContent;
      let finished = false;
      titleNode.contentEditable = true;
      titleNode.focus();
      titleNode.style.outline = "1px solid white";
      titleNode.style.paddingRight = "5px";
      titleNode.style.cursor = "text";
      const finishEdit = ({ cancel } = { cancel: false }) => {
        if (finished) return;
        finished = true;
        titleNode.contentEditable = false;
        titleNode.style.outline = "none";
        titleNode.style.paddingRight = "30px";
        titleNode.style.cursor = "pointer";
        if (cancel) {
          titleNode.textContent = previousTitle;
        }
        const cleaned = (titleNode.textContent || "").trim();
        titleNode.textContent = cleaned.length > 0 ? cleaned : "Untitled";
        titleNode.removeEventListener("keydown", onKeyDown);
        saveState();
      };
      const onKeyDown = (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          finishEdit();
        } else if (event.key === "Escape") {
          event.preventDefault();
          finishEdit({ cancel: true });
        }
      };
      titleNode.addEventListener("blur", finishEdit, { once: true });
      titleNode.addEventListener("keydown", onKeyDown);
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
      applyChatDropToFolder(chatData, newFolder);
    });
    newFolder.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (titleNode.contentEditable === "true") return;
      if (e.detail === 1) {
        clickTimer = setTimeout(() => {
          clickTimer = null;
          newFolder.isOpen = !newFolder.isOpen;
          if (iconElement) iconElement.textContent = newFolder.isOpen ? "folder_open" : "folder";
          if (newFolder.isOpen && runtime.openFolder && runtime.openFolder !== newFolder) {
            runtime.openFolder.isOpen = false;
            const oldIcon = runtime.openFolder.querySelector(".mat-icon");
            if (oldIcon) oldIcon.textContent = "folder";
            const oldContainer = runtime.openFolder.querySelector(".virtual-chat-container");
            if (oldContainer) oldContainer.style.display = "none";
          }
          runtime.openFolder = newFolder.isOpen ? newFolder : null;
          renderVirtualChats(newFolder);
          updateFolderChatCount(newFolder);
          document.querySelectorAll(SELECTORS.conversationItem).forEach((chat) => {
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
    updateFolderChatCount(newFolder);
    return newFolder;
  };

  // src/content/state/store.js
  var appState = { folders: [], chatMappings: {} };
  var getAppState = () => appState;
  var saveState = () => {
    if (!appState.chatMappings) appState.chatMappings = {};
    const state = { folders: [], chatMappings: appState.chatMappings };
    const folderIds = /* @__PURE__ */ new Set();
    document.querySelectorAll(SELECTORS.folderItem).forEach((folderNode) => {
      const titleNode = folderNode.querySelector(SELECTORS.titleContainer);
      const cleanedName = (titleNode ? titleNode.textContent : "").trim();
      folderIds.add(folderNode.id);
      state.folders.push({
        id: folderNode.id,
        name: cleanedName.length > 0 ? cleanedName : "Untitled"
      });
    });
    for (const chatId of Object.keys(state.chatMappings)) {
      const mapping = state.chatMappings[chatId];
      if (!mapping || !mapping.folder || !folderIds.has(mapping.folder)) {
        delete state.chatMappings[chatId];
      }
    }
    appState = state;
    chrome.storage.local.set({ gemini_folders_state: state }, () => {
      void chrome.runtime?.lastError;
    });
    refreshAllFolderCounts();
  };
  var loadState = (onLoaded) => {
    chrome.storage.local.get(["gemini_folders_state"], (result) => {
      void chrome.runtime?.lastError;
      if (result.gemini_folders_state) {
        appState = result.gemini_folders_state;
        if (!appState.chatMappings) appState.chatMappings = {};
        if (!appState.folders) appState.folders = [];
        const didMigrate = migrateLegacyChatMappings(appState);
        if (didMigrate) {
          chrome.storage.local.set({ gemini_folders_state: appState }, () => {
            void chrome.runtime?.lastError;
          });
        }
      }
      onLoaded();
    });
  };

  // src/content/chat/draggable.js
  var activeDragPreview = null;
  var activeDragState = null;
  var hoveredFolder = null;
  var suppressNextClick = false;
  var DRAG_OFFSET_X = 18;
  var DRAG_OFFSET_Y = 18;
  var DRAG_START_THRESHOLD_PX = 5;
  var dragListenersAttached = false;
  var removeActiveDragPreview = () => {
    if (activeDragPreview && activeDragPreview.parentNode) {
      activeDragPreview.parentNode.removeChild(activeDragPreview);
    }
    activeDragPreview = null;
  };
  var clearHoveredFolderHighlight = () => {
    if (hoveredFolder) {
      hoveredFolder.style.backgroundColor = "transparent";
      hoveredFolder = null;
    }
  };
  var setHoveredFolder = (folderNode) => {
    if (hoveredFolder === folderNode) return;
    clearHoveredFolderHighlight();
    if (folderNode) {
      hoveredFolder = folderNode;
      hoveredFolder.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
    }
  };
  var resetDraggedChatStyles = (chat) => {
    if (!chat) return;
    chat.style.opacity = "1";
    chat.style.transform = "";
    chat.style.boxShadow = "";
    chat.style.backgroundColor = "";
    chat.style.cursor = "grab";
    chat.style.userSelect = "";
  };
  var setDraggedChatStyles = (chat) => {
    if (!chat) return;
    chat.style.opacity = "0.72";
    chat.style.transform = "scale(1.02)";
    chat.style.boxShadow = "0 12px 28px rgba(0, 0, 0, 0.28)";
    chat.style.backgroundColor = "rgba(255, 255, 255, 0.06)";
    chat.style.cursor = "grab";
    chat.style.userSelect = "none";
  };
  var makePreviewFromChat = (chat) => {
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
  var positionDragPreview = (preview, clientX, clientY) => {
    if (!preview) return;
    preview.style.transform = `translate(${Math.round(clientX + DRAG_OFFSET_X)}px, ${Math.round(clientY + DRAG_OFFSET_Y)}px)`;
  };
  var getFolderFromPoint = (clientX, clientY) => {
    const element = document.elementFromPoint(clientX, clientY);
    return element ? element.closest(".folder-item") : null;
  };
  var applyDropAtPoint = (clientX, clientY) => {
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
  var cancelActiveDrag = () => {
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
  var disableLinkDragGhost = (chat) => {
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
  var handlePointerMove = (event) => {
    if (!activeDragState || event.pointerId !== activeDragState.pointerId) return;
    const deltaX = event.clientX - activeDragState.startX;
    const deltaY = event.clientY - activeDragState.startY;
    if (!activeDragState.isDragging) {
      if (deltaX * deltaX + deltaY * deltaY < DRAG_START_THRESHOLD_PX * DRAG_START_THRESHOLD_PX) {
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
  var handlePointerUp = (event) => {
    if (!activeDragState || event.pointerId !== activeDragState.pointerId) return;
    if (activeDragState.isDragging) {
      applyDropAtPoint(event.clientX, event.clientY);
    } else {
      cancelActiveDrag();
    }
  };
  var handlePointerCancel = (event) => {
    if (!activeDragState || event.pointerId !== activeDragState.pointerId) return;
    cancelActiveDrag();
  };
  var makeDraggable = () => {
    const appState2 = getAppState();
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
      if (appState2.chatMappings[chat.id] && appState2.chatMappings[chat.id].folder) {
        chat.dataset.folder = appState2.chatMappings[chat.id].folder;
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

  // src/content/dom/sidebar-injection.js
  var putborder = () => {
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
      const appState2 = getAppState();
      if (appState2.folders && appState2.folders.length > 0) {
        appState2.folders.forEach((folder) => {
          const restored = createFolderUI(folder.id, folder.name, folderSkeleton);
          folderList.appendChild(restored);
        });
      }
      if (appState2.folders && appState2.folders.length === 0) {
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

  // src/content/core/controller.js
  var controllerQueued = false;
  var controllerRetryTimer = null;
  var controllerThrottleTimer = null;
  var lastControllerRunAt = 0;
  var MIN_CONTROLLER_INTERVAL_MS = 200;
  var scheduleCoreController = () => {
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
  var coreController = () => {
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

  // src/content/main.js
  (function() {
    "use strict";
    const GLOBAL_KEY = "__GEMINI_FOLDERS__";
    const existing = globalThis[GLOBAL_KEY];
    if (existing && existing.initialized) return;
    globalThis[GLOBAL_KEY] = { initialized: true };
    loadState(() => {
      const intervalId = setInterval(scheduleCoreController, 1500);
      const observer = new MutationObserver(scheduleCoreController);
      observer.observe(document.body, { childList: true, subtree: true });
      globalThis[GLOBAL_KEY].intervalId = intervalId;
      globalThis[GLOBAL_KEY].observer = observer;
      coreController();
    });
  })();
})();
