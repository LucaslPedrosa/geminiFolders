export const SELECTORS = {
  folderItem: ".folder-item",
  titleContainer: ".title-container, .title-text, [data-test-id='conversation-title'], .conversation-title, .mdc-list-item__primary-text",
  conversationTitle: ".title-text, [data-test-id='conversation-title'], .conversation-title, .title-container, .mdc-list-item__primary-text",
  conversationListContainer: ".conversations-container, nav, aside",
  conversationItem: "gem-nav-list-item[data-test-id='conversation']",
  conversationLink: "gem-nav-list-item[data-test-id='conversation'] > a.mat-mdc-list-item, gem-nav-list-item[data-test-id='conversation'] a[href]",
  conversationTrailingContent: ".hovered-trailing-content",
  conversationActionsMenuHost: "gem-icon-button[data-test-id='actions-menu-button']",
  conversationActionsMenuButton: "gem-icon-button[data-test-id='actions-menu-button'] > button",
  sideNavEntry: ".side-nav-entry-container",
  gemsListContainer: ".gems-list-container",
  sectionTitle: ".title-container.ng-trigger"
};

export const IDS = {
  folderList: "custom-folder-list",
  folderSpace: "custom-folder-space",
  newFolderButton: "custom-new-folder-btn"
};
