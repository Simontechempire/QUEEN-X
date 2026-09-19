const config = require("../config");

function createMessageHandler(sock) {
  if (!sock) {
    throw new Error("WhatsApp socket is required.");
  }

  return async function handleMessage(message) {
    try {
      if (!message || !message.message) {
        return;
      }

      const remoteJid = message.key?.remoteJid;

      if (!remoteJid) {
        return;
      }

      const text =
        message.message.conversation ||
        message.message.extendedTextMessage?.text ||
        message.message.imageMessage?.caption ||
        message.message.videoMessage?.caption ||
        "";

      if (!text) {
        return;
      }

      const prefix = config.bot.prefix || ".";

      if (!text.startsWith(prefix)) {
        return;
      }

      const body = text.slice(prefix.length).trim();

      if (!body) {
        return;
      }

      const parts = body.split(/\s+/);
      const command = parts.shift().toLowerCase();
      const args = parts;

      console.log(
        `[COMMAND] ${command}`,
        args
      );

      // Command loader will be connected here next.
      console.log(
        `Command received: ${command}`
      );

    } catch (error) {
      console.error(
        "Message handler error:",
        error
      );
    }
  };
}

module.exports = {
  createMessageHandler
};
