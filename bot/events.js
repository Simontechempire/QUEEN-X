function registerEvents(sock) {
  if (!sock) {
    throw new Error("WhatsApp socket is required.");
  }

  sock.ev.on("messages.upsert", async ({ messages }) => {
    try {
      for (const message of messages) {
        if (!message || !message.message) {
          continue;
        }

        console.log(
          "Message received:",
          message.key?.remoteJid || "unknown"
        );
      }
    } catch (error) {
      console.error(
        "Message event error:",
        error
      );
    }
  });

  sock.ev.on("contacts.update", contacts => {
    console.log(
      `Contacts updated: ${contacts.length}`
    );
  });

  sock.ev.on("groups.update", groups => {
    console.log(
      `Groups updated: ${groups.length}`
    );
  });

  return sock;
}

module.exports = {
  registerEvents
};
