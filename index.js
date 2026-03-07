(function () {
  'use strict';

  let openFolder = null;
  let cacheMappings = {};
  let currentDraggedChat = null;

  chrome.storage.local.get(["gemini_folders_state"], (result) => {
    cacheMappings = result.gemini_folders_state?.chatMappings || {};
  });

  const saveState = () => {
    const state = { folders: [], chatMappings: {} };

    document.querySelectorAll(".folder-item").forEach(f => {
      state.folders.push({
        id: f.id,
        name: f.querySelector(".title-container").textContent
      });
    });

    document.querySelectorAll(".conversation-items-container").forEach(chat => {
      if (chat.dataset.folder) {
        state.chatMappings[chat.id] = chat.dataset.folder;
      }
    });

    cacheMappings = state.chatMappings;
    chrome.storage.local.set({ "gemini_folders_state": state });
  };

  const createFolderUI = (id, name, folderSkeleton, folderList) => {
    let newFolder = folderSkeleton.cloneNode(true);
    newFolder.id = id;
    newFolder.isOpen = false;
    newFolder.classList.add("folder-item");
    newFolder.style.position = "relative";

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

    newFolder.addEventListener("mouseenter", () => deleteBtn.style.opacity = "1");
    newFolder.addEventListener("mouseleave", () => deleteBtn.style.opacity = "0");

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

      document.querySelectorAll(".conversation-items-container").forEach(chat => {
        if (chat.dataset.folder === newFolder.id) {
          delete chat.dataset.folder;
          chat.style.display = "flex";
        }
      });

      if (openFolder === newFolder) openFolder = null;
      newFolder.remove();
      saveState();
    });

    titleNode.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      titleNode.contentEditable = true;
      titleNode.focus();
      titleNode.style.outline = "1px solid white";
      titleNode.style.paddingRight = "5px";

      const finishEdit = () => {
        titleNode.contentEditable = false;
        titleNode.style.outline = "none";
        titleNode.style.paddingRight = "30px";
        saveState();
      };

      titleNode.addEventListener("blur", finishEdit, { once: true });
      titleNode.addEventListener("keydown", (ek) => {
        if (ek.key === "Enter") {
          ek.preventDefault();
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

      const chatId = e.dataTransfer.getData('text/plain');
      const chatElement = document.getElementById(chatId);

      if (chatElement) {
        if (chatElement.dataset.folder === newFolder.id) {
          delete chatElement.dataset.folder;
          chatElement.style.display = "none";
        } else {
          chatElement.dataset.folder = newFolder.id;
          chatElement.style.display = newFolder.isOpen ? "flex" : "none";
        }
        saveState();
      }
    });

    newFolder.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      newFolder.isOpen = !newFolder.isOpen;
      iconElement.textContent = newFolder.isOpen ? "folder_open" : "folder";

      if (newFolder.isOpen && openFolder && openFolder !== newFolder) {
        openFolder.isOpen = false;
        const oldIcon = openFolder.querySelector(".mat-icon");
        if (oldIcon) oldIcon.textContent = "folder";
      }
      openFolder = newFolder.isOpen ? newFolder : null;

      document.querySelectorAll(".conversation-items-container").forEach((chat) => {
        if (newFolder.isOpen) {
          chat.style.display = (chat.dataset.folder === newFolder.id) ? "flex" : "none";
        } else {
          chat.style.display = chat.dataset.folder ? "none" : "flex";
        }
      });
    });

    return newFolder;
  };

  const makeDraggable = () => {
    const chats = document.querySelectorAll(".conversation-items-container");

    chats.forEach((chat) => {
      if (chat.config) return;

      if (!chat.id) {
        let link = chat.querySelector('a');
        if (link && link.href) {
          let match = link.href.match(/\/app\/([a-z0-9]+)/);
          chat.id = match ? "chat-" + match[1] : "chat-" + Math.random().toString(36).substr(2, 9);
        } else {
          chat.id = "chat-" + Math.random().toString(36).substr(2, 9);
        }
      }

      if (cacheMappings[chat.id]) {
        chat.dataset.folder = cacheMappings[chat.id];
      }

      if (openFolder) {
        chat.style.display = (chat.dataset.folder === openFolder.id) ? "flex" : "none";
      } else {
        chat.style.display = chat.dataset.folder ? "none" : "flex";
      }

      chat.draggable = true;
      chat.config = true;

      chat.addEventListener('dragstart', (e) => {
        chat.style.opacity = '0.4';
        e.dataTransfer.setData("text/plain", chat.id);
        currentDraggedChat = chat;

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

      chat.addEventListener('dragend', () => {
        chat.style.opacity = '1';

        if (currentDraggedChat && currentDraggedChat.dataset.folder) {
          const parentFolder = document.getElementById(currentDraggedChat.dataset.folder);
          if (parentFolder) {
            const currentIcon = parentFolder.querySelector(".mat-icon");
            if (currentIcon) {
              currentIcon.textContent = parentFolder.isOpen ? "folder_open" : "folder";
              currentIcon.style.color = "";
            }
          }
        }
        currentDraggedChat = null;
      });
    });
  };

  const putborder = () => {
    makeDraggable();
    const el = document.querySelector(".gems-list-container");
    const items = document.querySelector(".side-nav-entry-container");
    const cvs = document.querySelector(".title-container.ng-trigger");

    if (!el || !items || !cvs) return;
    if (document.getElementById("custom-folder-list")) return;

    const existingBtn = document.getElementById("custom-new-folder-btn");
    if (existingBtn) existingBtn.remove();

    const btnNewFolder = items.cloneNode(true);
    btnNewFolder.id = "custom-new-folder-btn";
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
    folderList.id = "custom-folder-list";
    folderSpace.appendChild(folderList);

    chrome.storage.local.get(["gemini_folders_state"], (result) => {
      const state = result.gemini_folders_state;
      if (state?.folders) {
        state.folders.forEach(f => {
          const restored = createFolderUI(f.id, f.name, folderSkeleton, folderList);
          folderList.appendChild(restored);
        });
      }
    });

    btnNewFolder.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = 'folder-' + Math.random().toString(36).substr(2, 9);
      const newF = createFolderUI(id, "New Folder", folderSkeleton, folderList);
      folderList.appendChild(newF);
      saveState();
    });

    el.insertAdjacentElement("beforebegin", btnNewFolder);
    el.insertAdjacentElement("afterend", folderSpace);
  };

  const obs = new MutationObserver(putborder);
  obs.observe(document.body, { childList: true, subtree: true });

})();
