const config = require("../config");
const { loadCommands } = require("../lib/commandLoader");

const commands = loadCommands();

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
      const commandName = parts.shift().toLowerCase();
      const args = parts;

      const command = commands.get(commandName);

      if (!command) {
        return;
      }

      console.log(
        `[COMMAND] ${commandName}`
      );

      await command.execute({
        sock,
        message,
        remoteJid,
        args,
        command: commandName,
        config
      });

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
