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
    newFolderButton: "custom-new-folder-btn"
  };

  // src/content/state/runtime.js
  var runtime = {
    openFolder: null,
    currentDraggedChat: null
  };

  // src/content/state/migrations.js
  var migrateLegacyChatMappings = (state) => {
    for (const key in state.chatMappings) {
      if (typeof state.chatMappings[key] === "string") {
        state.chatMappings[key] = {
          folder: state.chatMappings[key],
          title: "Chat Recuperado",
          url: ""
        };
      }
    }
  };

  // src/content/state/store.js
  var appState = { folders: [], chatMappings: {} };
  var getAppState = () => appState;
  var saveState = () => {
    const state = { folders: [], chatMappings: appState.chatMappings };
    document.querySelectorAll(SELECTORS.folderItem).forEach((folderNode) => {
      const titleNode = folderNode.querySelector(SELECTORS.titleContainer);
      state.folders.push({
        id: folderNode.id,
        name: titleNode ? titleNode.textContent : ""
      });
    });
    appState = state;
    chrome.storage.local.set({ gemini_folders_state: state });
  };
  var loadState = (onLoaded) => {
    chrome.storage.local.get(["gemini_folders_state"], (result) => {
      if (result.gemini_folders_state) {
        appState = result.gemini_folders_state;
        if (!appState.chatMappings) appState.chatMappings = {};
        if (!appState.folders) appState.folders = [];
        migrateLegacyChatMappings(appState);
      }
      onLoaded();
    });
  };

  // src/content/chat/draggable.js
  var makeDraggable = () => {
    const appState2 = getAppState();
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
      if (appState2.chatMappings[chat.id] && appState2.chatMappings[chat.id].folder) {
        chat.dataset.folder = appState2.chatMappings[chat.id].folder;
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
  var createFolderUI = (id, name, folderSkeleton) => {
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
      const appState2 = getAppState();
      const chatElement = document.getElementById(chatData.id);
      if (chatElement) {
        if (chatElement.dataset.folder === newFolder.id) {
          delete chatElement.dataset.folder;
          delete appState2.chatMappings[chatData.id];
          chatElement.style.display = "none";
        } else {
          chatElement.dataset.folder = newFolder.id;
          appState2.chatMappings[chatData.id] = {
            folder: newFolder.id,
            title: chatData.title,
            url: chatData.url
          };
          chatElement.style.display = newFolder.isOpen ? "flex" : "none";
        }
      } else {
        appState2.chatMappings[chatData.id] = {
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

  // src/content/dom/sidebar-injection.js
  var putborder = () => {
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
    const appState2 = getAppState();
    if (appState2.folders) {
      appState2.folders.forEach((folder) => {
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

  // src/content/core/controller.js
  var coreController = () => {
    const el = document.querySelector(SELECTORS.gemsListContainer);
    const items = document.querySelector(SELECTORS.sideNavEntry);
    const cvs = document.querySelector(SELECTORS.sectionTitle);
    const isUIRendered = document.body.contains(document.getElementById(IDS.folderList));
    if (el && items && cvs && !isUIRendered) {
      putborder();
    }
    makeDraggable();
  };

  // src/content/main.js
  (function() {
    "use strict";
    loadState(() => {
      setInterval(coreController, 800);
      const observer = new MutationObserver(coreController);
      observer.observe(document.body, { childList: true, subtree: true });
      coreController();
    });
  })();
})();
