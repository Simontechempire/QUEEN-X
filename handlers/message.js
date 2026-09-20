const {
  getCommand,
  loadCommands
} = require("../lib/commandLoader");

const PREFIX = process.env.PREFIX || ".";

// Load all commands when this file starts
loadCommands();

function getText(message) {
  if (!message) return "";

  return (
    message.conversation ||
    message.extendedTextMessage?.text ||
    message.imageMessage?.caption ||
    message.videoMessage?.caption ||
    message.documentMessage?.caption ||
    ""
  );
}

function getSender(message) {
  return (
    message.key?.participant ||
    message.key?.remoteJid ||
    ""
  );
}

async function handleMessage(sock, message) {
  try {
    if (!message || !message.message) {
      return;
    }

    // Ignore messages sent by the bot itself
    if (message.key?.fromMe) {
      return;
    }

    const text = getText(message).trim();

    if (!text.startsWith(PREFIX)) {
      return;
    }

    const body = text.slice(PREFIX.length).trim();

    if (!body) {
      return;
    }

    const parts = body.split(/\s+/);

    const commandName = parts
      .shift()
      .toLowerCase();

    const args = parts;

    const command = getCommand(commandName);

    if (!command) {
      return;
    }

    const remoteJid =
      message.key?.remoteJid;

    if (!remoteJid) {
      return;
    }

    console.log(
      `📩 Command: ${PREFIX}${commandName}`
    );

    // Special handler commands
    if (
      typeof command.handleCommand === "function"
    ) {
      await command.handleCommand({
        sock,
        message,
        remoteJid,
        command: commandName,
        args
      });

      return;
    }

    if (
      typeof command.handleViewOnceCommand ===
      "function"
    ) {
      await command.handleViewOnceCommand({
        sock,
        message,
        remoteJid,
        command: commandName,
        args
      });

      return;
    }

    if (
      typeof command.handleSettingsCommand ===
      "function"
    ) {
      await command.handleSettingsCommand({
        sock,
        message,
        remoteJid,
        command: commandName,
        args
      });

      return;
    }

    if (
      typeof command.handleSecurityCommand ===
      "function"
    ) {
      await command.handleSecurityCommand({
        sock,
        message,
        remoteJid,
        command: commandName,
        args
      });

      return;
    }

    if (
      typeof command.handleUtilityCommand ===
      "function"
    ) {
      await command.handleUtilityCommand({
        sock,
        message,
        remoteJid,
        command: commandName,
        args
      });

      return;
    }

    if (
      typeof command.handleAutomationCommand ===
      "function"
    ) {
      await command.handleAutomationCommand({
        sock,
        message,
        remoteJid,
        command: commandName,
        args
      });

      return;
    }

    // Normal command
    if (typeof command.execute === "function") {
      await command.execute({
        sock,
        message,
        remoteJid,
        sender: getSender(message),
        command: commandName,
        args
      });
    }

  } catch (error) {
    console.error(
      "❌ Message handler error:",
      error
    );

    try {
      const jid = message?.key?.remoteJid;

      if (jid) {
        await sock.sendMessage(jid, {
          text:
            "❌ 𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗘𝗥𝗥𝗢𝗥\n\n" +
            "Something went wrong while processing the command."
        });
      }
    } catch (sendError) {
      console.error(
        "❌ Error message failed:",
        sendError
      );
    }
  }
}

module.exports = {
  handleMessage,
  getText,
  getSender
};
