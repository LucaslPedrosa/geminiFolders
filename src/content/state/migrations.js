export const migrateLegacyChatMappings = (state) => {
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
