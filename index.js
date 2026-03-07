(function () {
  'use strict';

  let openFolder = null;
  let isSet = false;
  let cacheMappings = {};

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

    const titleNode = newFolder.querySelector(".title-container");
    titleNode.textContent = name;

    const iconElement = newFolder.querySelector(".mat-icon");
    if (iconElement) iconElement.textContent = "folder";

    titleNode.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      titleNode.contentEditable = true;
      titleNode.focus();
      titleNode.style.outline = "1px solid white";

      const finishEdit = () => {
        titleNode.contentEditable = false;
        titleNode.style.outline = "none";
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
        chatElement.style.display = "none";
        chatElement.dataset.folder = newFolder.id;
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
      });

      chat.addEventListener('dragend', () => {
        chat.style.opacity = '1';
      });
    });
  };

  const putborder = () => {
    makeDraggable();
    const el = document.querySelector(".gems-list-container");

    if (!isSet && el) {
      const items = document.querySelector(".side-nav-entry-container");
      const cvs = document.querySelector(".title-container.ng-trigger");

      const btnNewFolder = items.cloneNode(true);
      btnNewFolder.querySelector(".title-container").textContent = "New folder";
      const iconContainer = btnNewFolder.querySelector(".mat-icon").parentElement;
      iconContainer.textContent = "";
      const icon = document.createElement("span");
      icon.className = "mat-icon notranslate google-symbols mat-ligature-font material-icons-outlined";
      icon.textContent = "create_new_folder";
      iconContainer.appendChild(icon);

      const folderSkeleton = btnNewFolder.cloneNode(true);

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
      isSet = true;
    }
  };

  const obs = new MutationObserver(putborder);
  obs.observe(document.body, { childList: true, subtree: true });

})();
