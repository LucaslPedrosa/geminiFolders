import { runtime } from "../state/runtime.js";
import { getAppState } from "../state/store.js";
import { SELECTORS } from "../config/selectors.js";
import { scheduleCoreController } from "../core/controller.js";

const temporarilyUnfolderChats = (folder) => {
  const appState = getAppState();
  const moved = [];

  const convList = document.querySelector(SELECTORS.conversationListContainer) || document.querySelector(SELECTORS.conversationItem)?.parentElement || document.body;

  for (const id in appState.chatMappings) {
    const info = appState.chatMappings[id];
    if (!info || info.folder !== folder.id) continue;
    const el = document.getElementById(id);
    if (!el) continue;

    moved.push({ el, parent: el.parentNode, nextSibling: el.nextSibling, folder: el.dataset.folder });

    try {
      delete el.dataset.folder;
      convList.appendChild(el);
      el.style.display = "flex";
    } catch (e) {}
  }

  return moved;
};

const restoreMovedChats = (moved) => {
  if (!moved || !moved.length) return;
  moved.forEach((rec) => {
    try {
      if (rec.parent && rec.parent.contains && rec.parent !== document.body) {
        if (rec.nextSibling && rec.nextSibling.parentNode === rec.parent) rec.parent.insertBefore(rec.el, rec.nextSibling); else rec.parent.appendChild(rec.el);
      }
      if (rec.folder) rec.el.dataset.folder = rec.folder;
    } catch (e) {}
  });
};

const getScrollableAncestor = (node) => {
  let current = node;
  while (current && current !== document.body) {
    const style = window.getComputedStyle(current);
    const canScrollY = /(auto|scroll)/.test(style.overflowY);
    if (canScrollY && current.scrollHeight > current.clientHeight) {
      return current;
    }
    current = current.parentElement;
  }
  return document.scrollingElement || document.documentElement;
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRootScrollNode = (node) => {
  return node === document.scrollingElement || node === document.documentElement || node === document.body;
};

const collectScrollTargets = (firstChatLink) => {
  const candidates = [];

  try {
    const listContainer = document.querySelector(SELECTORS.conversationListContainer);
    if (listContainer) candidates.push(listContainer);
  } catch {}

  try {
    const convoItems = document.querySelector(SELECTORS.conversationItem);
    if (convoItems) candidates.push(convoItems);
  } catch {}

  if (firstChatLink) {
    const anc = getScrollableAncestor(firstChatLink);
    if (anc) candidates.push(anc);
  }

  candidates.push(document.scrollingElement || document.documentElement, document.documentElement, document.body);

  const seen = new Set();
  const targets = [];
  for (const node of candidates) {
    if (!node || seen.has(node)) continue;
    seen.add(node);
    targets.push(node);
  }

  return targets;
};

const scrollTargetToBottom = (target) => {
  try {
    if (!target) return;

    if (isRootScrollNode(target)) {
      const root = document.scrollingElement || document.documentElement;
      const bottom = Math.max(root.scrollHeight, document.documentElement.scrollHeight, document.body?.scrollHeight || 0);
      window.scrollTo(0, bottom);
      root.scrollTop = bottom;
      document.documentElement.scrollTop = bottom;
      if (document.body) document.body.scrollTop = bottom;
      return;
    }

    const bottom = target.scrollHeight;
    target.scrollTop = bottom;
    target.scrollTo?.(0, bottom);
  } catch (e) {}
};

const sendScrollSignals = (target, deltaY = 900) => {
  try {
    if (!target) return;

    const rect = target.getBoundingClientRect?.() || { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
    const clientX = Math.floor(rect.left + (rect.width || window.innerWidth) / 2);
    const clientY = Math.floor(rect.top + (rect.height || window.innerHeight) / 2);

    const wheel = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaX: 0,
      deltaY,
      deltaMode: 0,
      clientX,
      clientY,
      view: window
    });

    target.dispatchEvent(wheel);
    target.dispatchEvent(new Event("scroll", { bubbles: true }));
    window.dispatchEvent(new Event("scroll"));
  } catch (e) {}
};

const getMissingChatsInFolder = (folderId) => {
  const appStateNow = getAppState();
  let missing = 0;

  for (const id in appStateNow.chatMappings) {
    const info = appStateNow.chatMappings[id];
    if (!info || info.folder !== folderId) continue;
    if (!document.getElementById(id)) missing += 1;
  }

  return missing;
};

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

  let missingCount = 0;
  let loadedCount = 0;

  for (const chatId in appState.chatMappings) {
    const chatInfo = appState.chatMappings[chatId];
    if (!chatInfo || chatInfo.folder !== folder.id) continue;

    const domElement = document.getElementById(chatId);

    if (folder.isOpen) {
      if (domElement) {
        domElement.style.display = "flex";
        loadedCount += 1;
      } else {
        missingCount += 1;
      }
    } else if (domElement) {
      domElement.style.display = "none";
    }
  }

  if (folder.isOpen && missingCount > 0) {
    const hint = document.createElement("button");
    hint.type = "button";
    hint.textContent = loadedCount > 0
      ? `Load more chats (${missingCount} hidden)`
      : `Load more chats (${missingCount} in this folder)`;
    hint.style.display = "flex";
    hint.style.alignItems = "center";
    hint.style.justifyContent = "center";
    hint.style.gap = "6px";
    hint.style.width = "100%";
    hint.style.padding = "8px 12px";
    hint.style.margin = "6px 8px 2px 0";
    hint.style.borderRadius = "10px";
    hint.style.border = "1px dashed rgba(255, 255, 255, 0.22)";
    hint.style.background = "rgba(255, 255, 255, 0.04)";
    hint.style.color = "#d7dad7";
    hint.style.fontSize = "12px";
    hint.style.fontWeight = "600";
    hint.style.letterSpacing = "0.2px";
    hint.style.userSelect = "none";
    hint.style.cursor = "pointer";
    hint.style.transition = "background 120ms ease, border-color 120ms ease";

    hint.addEventListener("mouseenter", () => {
      hint.style.background = "rgba(255, 255, 255, 0.08)";
      hint.style.borderColor = "rgba(255, 255, 255, 0.4)";
    });

    hint.addEventListener("mouseleave", () => {
      hint.style.background = "rgba(255, 255, 255, 0.04)";
      hint.style.borderColor = "rgba(255, 255, 255, 0.22)";
    });

    hint.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const firstChatLink = document.querySelector(SELECTORS.conversationLink) || document.querySelector(SELECTORS.conversationItem + " a");

      // Temporarily move mapped chats back into the conversation list so Gemini treats
      // them as part of the main list (simulates extension not filtering them).
      const moved = temporarilyUnfolderChats(folder);

      const targets = collectScrollTargets(firstChatLink);
      const maxAttempts = 14;
      const holdDelayMs = 180;

      const driveLoading = async () => {
        for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
          scheduleCoreController();

          for (const target of targets) {
            scrollTargetToBottom(target);
            sendScrollSignals(target, attempt < 4 ? 1200 : 800);
          }

          renderVirtualChats(folder);

          if (getMissingChatsInFolder(folder.id) === 0) {
            break;
          }

          await delay(holdDelayMs + Math.min(attempt * 20, 120));
        }
      };

      driveLoading().catch(() => {}).finally(() => {
        restoreMovedChats(moved);
        scheduleCoreController();
        renderVirtualChats(folder);
      });
    });

    virtualContainer.appendChild(hint);

    // Fallback: open missing chats directly if auto-scroll/drag fails
    const OPEN_LIMIT = 12;
    const openBtn = document.createElement("button");
    openBtn.type = "button";
    openBtn.textContent = `Open hidden chats (${Math.min(missingCount, OPEN_LIMIT)})`;
    openBtn.style.display = "flex";
    openBtn.style.alignItems = "center";
    openBtn.style.justifyContent = "center";
    openBtn.style.width = "100%";
    openBtn.style.padding = "8px 12px";
    openBtn.style.margin = "6px 8px 6px 0";
    openBtn.style.borderRadius = "10px";
    openBtn.style.border = "1px solid rgba(255,255,255,0.06)";
    openBtn.style.background = "rgba(255,255,255,0.02)";
    openBtn.style.color = "#e3e3e3";
    openBtn.style.fontSize = "12px";
    openBtn.style.cursor = "pointer";

    openBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const appStateNow = getAppState();
      const missing = [];
      for (const id in appStateNow.chatMappings) {
        const info = appStateNow.chatMappings[id];
        if (!info || info.folder !== folder.id) continue;
        if (!document.getElementById(id) && info.url) missing.push(info.url);
      }

      if (missing.length === 0) return;

      const toOpen = missing.slice(0, OPEN_LIMIT);
      // open sequentially with slight delay to avoid popup blocking
      toOpen.forEach((u, idx) => {
        setTimeout(() => {
          try {
            window.open(u, "_blank");
          } catch (err) {}
        }, idx * 250);
      });
    });

    virtualContainer.appendChild(openBtn);
  }

  if (!folder.isOpen && runtime.openFolder === folder) {
    runtime.openFolder = null;
  }
};
