const { MAIN_MENU } = require("./menu");

async function handleMenu(sock, message) {
  const remoteJid = message?.key?.remoteJid;

  if (!remoteJid) {
    return;
  }

  await sock.sendMessage(remoteJid, {
    text: MAIN_MENU
  });
}

module.exports = {
  handleMenu
};
