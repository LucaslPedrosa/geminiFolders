(function () {
  'use strict';

  let openFolder = null;
  let currentDraggedChat = null;
  let appState = { folders: [], chatMappings: {} };

  // --- Função de Salvar Estado (Persistente) ---
  const saveState = () => {
    // Mantém o chatMappings existente para não apagar chats que não estão no DOM
    const state = { folders: [], chatMappings: appState.chatMappings };

    document.querySelectorAll(".folder-item").forEach(f => {
      state.folders.push({
        id: f.id,
        name: f.querySelector(".title-container").textContent
      });
    });

    appState = state;
    chrome.storage.local.set({ "gemini_folders_state": state });
  };

  // --- Renderizador de Chats Virtuais ---
  // Resolve o problema do Gemini apagar conversas antigas da tela (Virtual Scrolling)
  const renderVirtualChats = (folder) => {
    let virtualContainer = folder.querySelector('.virtual-chat-container');
    if (!virtualContainer) {
      virtualContainer = document.createElement('div');
      virtualContainer.className = 'virtual-chat-container';
      virtualContainer.style.paddingLeft = '15px'; // Recuo para os itens
      virtualContainer.style.display = 'none';
      folder.appendChild(virtualContainer);
    }

    virtualContainer.innerHTML = ''; // Limpa antes de renderizar
    virtualContainer.style.display = folder.isOpen ? "block" : "none";

    for (let chatId in appState.chatMappings) {
      const chatInfo = appState.chatMappings[chatId];

      // Verifica se o chat pertence a esta pasta
      if (!chatInfo || chatInfo.folder !== folder.id) continue;

      const domElement = document.getElementById(chatId);

      if (folder.isOpen) {
        if (domElement) {
          // O chat está visível no DOM do Gemini, apenas garantimos que ele apareça
          domElement.style.display = "flex";
        } else {
          // O chat NÃO está no DOM (foi apagado pelo Gemini), criamos um link virtual
          const fakeChat = document.createElement("a");
          fakeChat.href = chatInfo.url;
          fakeChat.textContent = chatInfo.title;
          fakeChat.style.display = "block";
          fakeChat.style.padding = "10px 15px";
          fakeChat.style.color = "#e3e3e3"; // Cor clara padrão do Gemini
          fakeChat.style.textDecoration = "none";
          fakeChat.style.fontSize = "14px";
          fakeChat.style.whiteSpace = "nowrap";
          fakeChat.style.overflow = "hidden";
          fakeChat.style.textOverflow = "ellipsis";
          fakeChat.style.borderRadius = "8px";
          fakeChat.style.marginTop = "2px";

          // Animação bonitinha de hover no chat virtual
          fakeChat.addEventListener("mouseenter", () => fakeChat.style.backgroundColor = "rgba(255, 255, 255, 0.08)");
          fakeChat.addEventListener("mouseleave", () => fakeChat.style.backgroundColor = "transparent");

          virtualContainer.appendChild(fakeChat);
        }
      } else {
        // Pasta fechada, esconde o elemento real se ele existir no DOM
        if (domElement) domElement.style.display = "none";
      }
    }
  };

  // --- Criação da Interface da Pasta ---
  const createFolderUI = (id, name, folderSkeleton, folderList) => {
    let newFolder = folderSkeleton.cloneNode(true);
    newFolder.id = id;
    newFolder.isOpen = false;
    newFolder.classList.add("folder-item");
    newFolder.style.position = "relative";
    newFolder.style.transition = "background-color 0.2s"; // Transição suave

    // Estilo do Título
    const titleNode = newFolder.querySelector(".title-container");
    titleNode.textContent = name;
    titleNode.style.paddingRight = "30px"; // Espaço para a lixeira
    titleNode.style.overflow = "hidden";
    titleNode.style.textOverflow = "ellipsis";
    titleNode.style.whiteSpace = "nowrap";

    // Ícone
    const iconElement = newFolder.querySelector(".mat-icon");
    if (iconElement) iconElement.textContent = "folder";

    // --- Criação do Botão de Deletar (CORRIGIDO ALINHAMENTO) ---
    const deleteBtn = document.createElement("span");
    deleteBtn.className = "mat-icon notranslate google-symbols mat-ligature-font";
    deleteBtn.textContent = "delete";
    deleteBtn.style.position = "absolute";
    deleteBtn.style.right = "8px";

    // RESTAURADO ALINHAMENTO ORIGINAL
    deleteBtn.style.top = "50%";
    deleteBtn.style.transform = "translateY(-50%)";

    deleteBtn.style.fontSize = "18px";
    deleteBtn.style.color = "#c4c7c5";
    deleteBtn.style.opacity = "0"; // Escondido por padrão
    deleteBtn.style.transition = "all 0.2s";
    deleteBtn.style.zIndex = "10";
    deleteBtn.style.display = "flex";
    deleteBtn.style.alignItems = "center";
    deleteBtn.style.justifyContent = "center";
    deleteBtn.style.width = "28px";
    deleteBtn.style.height = "28px";
    deleteBtn.style.borderRadius = "50%";

    newFolder.appendChild(deleteBtn);

    // --- Animações da Pasta e Lixeira ---
    newFolder.addEventListener("mouseenter", () => deleteBtn.style.opacity = "1");
    newFolder.addEventListener("mouseleave", () => deleteBtn.style.opacity = "0");

    deleteBtn.addEventListener("mouseenter", () => {
      deleteBtn.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
      deleteBtn.style.color = "#ff5c5c"; // Vermelho no hover da lixeira
    });

    deleteBtn.addEventListener("mouseleave", () => {
      deleteBtn.style.backgroundColor = "transparent";
      deleteBtn.style.color = "#c4c7c5";
    });

    // Ação de Deletar Pasta
    deleteBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Libera os chats reais que estavam no DOM
      document.querySelectorAll(".conversation-items-container").forEach(chat => {
        if (chat.dataset.folder === newFolder.id) {
          delete chat.dataset.folder;
          chat.style.display = "flex";
        }
      });

      // Remove os mapeamentos do estado (incluindo chats não renderizados)
      for (let cId in appState.chatMappings) {
        if (appState.chatMappings[cId] && appState.chatMappings[cId].folder === newFolder.id) {
          delete appState.chatMappings[cId];
        }
      }

      if (openFolder === newFolder) openFolder = null;
      newFolder.remove();
      saveState();
    });

    // --- Edição de Nome (Double Click) ---
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
      titleNode.addEventListener("keydown", (ek) => {
        if (ek.key === "Enter") {
          ek.preventDefault();
          finishEdit();
        }
      });
    });

    // --- Feedback Visual de Arrastar (CORRIGIDO/RESTAURADO) ---
    newFolder.addEventListener("dragover", (e) => {
      e.preventDefault();
      // Aumentado a opacidade para 0.2 para ficar mais visível (bonitinho)
      newFolder.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
    });

    newFolder.addEventListener("dragleave", () => {
      newFolder.style.backgroundColor = "transparent";
    });

    // Ação de Soltar Chat na Pasta (Drop)
    newFolder.addEventListener("drop", (e) => {
      e.preventDefault();
      newFolder.style.backgroundColor = "transparent";

      const chatDataString = e.dataTransfer.getData('text/plain');
      if (!chatDataString) return;

      let chatData;
      try {
        chatData = JSON.parse(chatDataString);
      } catch (err) {
        return;
      }

      const chatElement = document.getElementById(chatData.id);

      if (chatElement) {
        if (chatElement.dataset.folder === newFolder.id) {
          // Se já estava na pasta, remove (comportamento de toggle se arrastar pra mesma pasta)
          delete chatElement.dataset.folder;
          delete appState.chatMappings[chatData.id];
          chatElement.style.display = "none";
        } else {
          // Move para a pasta
          chatElement.dataset.folder = newFolder.id;
          appState.chatMappings[chatData.id] = {
            folder: newFolder.id,
            title: chatData.title,
            url: chatData.url
          };
          chatElement.style.display = newFolder.isOpen ? "flex" : "none";
        }
      } else {
        // Chat não está no DOM, mas salvamos o mapeamento mesmo assim
        appState.chatMappings[chatData.id] = {
          folder: newFolder.id,
          title: chatData.title,
          url: chatData.url
        };
      }

      saveState();

      // Força re-renderização se a pasta estiver aberta para mostrar o novo item virtual ou real
      if (newFolder.isOpen) {
        renderVirtualChats(newFolder);
      }
    });

    // --- Clique na Pasta (Abrir/Fechar) ---
    newFolder.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (titleNode.contentEditable === "true") return;

      if (e.detail === 1) { // Clique simples
        clickTimer = setTimeout(() => {
          newFolder.isOpen = !newFolder.isOpen;
          iconElement.textContent = newFolder.isOpen ? "folder_open" : "folder";

          // Fecha pasta anterior se houver (acordeão)
          if (newFolder.isOpen && openFolder && openFolder !== newFolder) {
            openFolder.isOpen = false;
            const oldIcon = openFolder.querySelector(".mat-icon");
            if (oldIcon) oldIcon.textContent = "folder";
            const oldContainer = openFolder.querySelector('.virtual-chat-container');
            if (oldContainer) oldContainer.style.display = "none";
          }
          openFolder = newFolder.isOpen ? newFolder : null;

          // Renderiza itens virtuais (ocultos pelo Gemini)
          renderVirtualChats(newFolder);

          // Gerencia visibilidade dos itens reais que estão no DOM
          document.querySelectorAll(".conversation-items-container").forEach((chat) => {
            if (newFolder.isOpen) {
              // Se abrir, mostra só os da pasta
              if (chat.dataset.folder !== newFolder.id) {
                chat.style.display = "none";
              }
            } else {
              // Se fechar, mostra os que não tem pasta
              chat.style.display = chat.dataset.folder ? "none" : "flex";
            }
          });
        }, 200);
      }
    });

    return newFolder;
  };

  // --- Torna Chats Arrastáveis ---
  const makeDraggable = () => {
    const chats = document.querySelectorAll(".conversation-items-container");

    chats.forEach((chat) => {
      if (chat.config) return; // Evita configurar duplicado

      // Gera ou recupera ID persistente
      if (!chat.id) {
        let link = chat.querySelector('a');
        if (link && link.href) {
          let match = link.href.match(/\/app\/([a-z0-9]+)/);
          chat.id = match ? "chat-" + match[1] : "chat-" + btoa(link.href).substring(0, 15);
        } else {
          // Ignora chats sem link carregado para evitar IDs aleatórios que quebram persistência
          return;
        }
      }

      // Aplica pertencimento à pasta baseado no estado carregado
      if (appState.chatMappings[chat.id] && appState.chatMappings[chat.id].folder) {
        chat.dataset.folder = appState.chatMappings[chat.id].folder;
      }

      // Define visibilidade inicial baseado se há pasta aberta
      if (openFolder) {
        chat.style.display = (chat.dataset.folder === openFolder.id) ? "flex" : "none";
      } else {
        chat.style.display = chat.dataset.folder ? "none" : "flex";
      }

      chat.draggable = true;
      chat.config = true; // Marca como configurado

      // Início do Arraste
      chat.addEventListener('dragstart', (e) => {
        chat.style.opacity = '0.4'; // Animação bonitinha de transparência

        const linkElement = chat.querySelector('a');
        const titleElement = chat.querySelector('.title-container') || chat;

        // Dados completos do chat para salvar no drop (independente do DOM)
        const chatData = {
          id: chat.id,
          url: linkElement ? linkElement.href : '',
          title: titleElement.textContent.trim()
        };

        e.dataTransfer.setData("text/plain", JSON.stringify(chatData));
        currentDraggedChat = chat;

        // Feedback visual na pasta pai se já estiver em uma
        if (chat.dataset.folder) {
          const parentFolder = document.getElementById(chat.dataset.folder);
          if (parentFolder) {
            const currentIcon = parentFolder.querySelector(".mat-icon");
            if (currentIcon) {
              currentIcon.textContent = "close";
              currentIcon.style.color = "#ff5c5c"; // Ícone de remover
            }
          }
        }
      });

      // Fim do Arraste
      chat.addEventListener('dragend', () => {
        chat.style.opacity = '1'; // Restaura opacidade

        // Restaura ícone da pasta pai
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

  // --- Injeção da UI na Barra Lateral ---
  const putborder = () => {
    const el = document.querySelector(".gems-list-container");
    const items = document.querySelector(".side-nav-entry-container");
    const cvs = document.querySelector(".title-container.ng-trigger");

    if (!el || !items || !cvs) return;

    // LIMPEZA SEGURA: Remove nós fantasmas antes de reinjetar (corrige bug de sumir)
    const existingList = document.getElementById("custom-folder-list");
    if (existingList) existingList.remove();
    const existingBtn = document.getElementById("custom-new-folder-btn");
    if (existingBtn) existingBtn.remove();

    // Cria Botão "New folder" clonando o estilo existente
    const btnNewFolder = items.cloneNode(true);
    btnNewFolder.id = "custom-new-folder-btn";
    btnNewFolder.querySelector(".title-container").textContent = "New folder";
    const iconContainer = btnNewFolder.querySelector(".mat-icon").parentElement;
    iconContainer.textContent = "";
    const icon = document.createElement("span");
    icon.className = "mat-icon notranslate google-symbols mat-ligature-font material-icons-outlined";
    icon.textContent = "create_new_folder";
    iconContainer.appendChild(icon);

    // Esqueleto para pastas futuras
    const folderSkeleton = btnNewFolder.cloneNode(true);
    folderSkeleton.removeAttribute("id");

    // Cria Seção "Folders" clonando título existente
    const folderSpace = cvs.cloneNode(true);
    folderSpace.querySelector("h1").textContent = "Folders";
    const folderList = document.createElement("div");
    folderList.id = "custom-folder-list";
    folderSpace.appendChild(folderList);

    // Restaura pastas salvas
    if (appState.folders) {
      appState.folders.forEach(f => {
        const restored = createFolderUI(f.id, f.name, folderSkeleton, folderList);
        folderList.appendChild(restored);
      });
    }

    // Ação do Botão Nova Pasta
    btnNewFolder.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = 'folder-' + Math.random().toString(36).substr(2, 9);
      const newF = createFolderUI(id, "New Folder", folderSkeleton, folderList);
      folderList.appendChild(newF);
      saveState();
    });

    // Injeta elementos no DOM
    el.insertAdjacentElement("beforebegin", btnNewFolder);
    el.insertAdjacentElement("afterend", folderSpace);
  };

  // --- Controlador Principal de Injeção Blindada ---
  const coreController = () => {
    const el = document.querySelector(".gems-list-container");
    const items = document.querySelector(".side-nav-entry-container");
    const cvs = document.querySelector(".title-container.ng-trigger");

    // Verificação robusta: a UI existe E está atrelada ao corpo visível do site?
    const isUIRendered = document.body.contains(document.getElementById("custom-folder-list"));

    // Se os elementos do Gemini existem, mas a nossa UI sumiu (foi recriada pelo framework), reinjeta.
    if (el && items && cvs && !isUIRendered) {
      putborder();
    }
    // Garante que chats novos (scroll) fiquem arrastáveis e respeitem visibilidade
    makeDraggable();
  };

  // --- Inicialização ---
  chrome.storage.local.get(["gemini_folders_state"], (result) => {
    if (result.gemini_folders_state) {
      appState = result.gemini_folders_state;
      if (!appState.chatMappings) appState.chatMappings = {};
      if (!appState.folders) appState.folders = [];

      // Migração de formato antigo (string) para novo (objeto) se necessário
      for (let key in appState.chatMappings) {
        if (typeof appState.chatMappings[key] === 'string') {
          appState.chatMappings[key] = { folder: appState.chatMappings[key], title: "Chat Recuperado", url: "" };
        }
      }
    }

    // Loop de verificação agressivo para combater o framework do Gemini (sumiço)
    setInterval(coreController, 800);

    // Observer para reações mais rápidas
    const obs = new MutationObserver(coreController);
    obs.observe(document.body, { childList: true, subtree: true });

    // Execução imediata
    coreController();
  });

})();
