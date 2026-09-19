const config = require("../../config");

const OWNER_COMMANDS = {
  owner: "showOwner",
  addowner: "addOwner",
  delowner: "delOwner",
  setprefix: "setPrefix",
  broadcast: "broadcast",
  bcgroup: "broadcastGroup",
  bcpv: "broadcastPrivate",
  block: "block",
  unblock: "unblock",
  restart: "restart",
  shutdown: "shutdown",
  update: "update",
  reload: "reload",
  eval: "evalCode",
  exec: "execCode",
  join: "join",
  leave: "leave",
  setbotname: "setBotName",
  setbio: "setBio",
  setstatus: "setStatus",
  public: "setPublic",
  private: "setPrivate",
  maintenance: "maintenance",
  plugins: "plugins",
  install: "install",
  uninstall: "uninstall",
  enable: "enable",
  disable: "disable",
  setvar: "setVar",
  getvar: "getVar",
  delvar: "delVar",
  backup: "backup",
  restore: "restore",
  logs: "logs",
  clearslogs: "clearLogs",
  stats: "stats",
  userinfo: "userInfo",
  groupinfo: "groupInfo",
  announce: "announce",
  notice: "notice",
  setowner: "setOwner",
  setmode: "setMode",
  session: "session",
  sessions: "sessions",
  delsession: "deleteSession",
  clearsession: "clearSession",
  support: "support",
  about: "about",
  ping: "ping",
  menu: "menu"
};

function normalizeNumber(number) {
  return String(number || "")
    .replace(/\D/g, "");
}

function isOwner(message) {
  const sender =
    message?.key?.participant ||
    message?.key?.remoteJid ||
    "";

  const ownerNumber = normalizeNumber(
    config.owner?.number ||
    config.ownerNumber ||
    process.env.OWNER_NUMBER
  );

  const senderNumber =
    normalizeNumber(sender);

  return (
    ownerNumber &&
    senderNumber &&
    senderNumber.includes(ownerNumber)
  );
}

async function send(sock, jid, text) {
  return sock.sendMessage(jid, { text });
}

async function handleOwnerCommand({
  sock,
  message,
  remoteJid,
  command,
  args = []
}) {
  if (!OWNER_COMMANDS[command]) {
    return false;
  }

  if (!isOwner(message)) {
    await send(
      sock,
      remoteJid,
      "❌ 𝗢𝗡𝗟𝗬 𝗧𝗛𝗘 𝗕𝗢𝗧 𝗢𝗪𝗡𝗘𝗥 𝗖𝗔𝗡 𝗨𝗦𝗘 𝗧𝗛𝗜𝗦 𝗖𝗢𝗠𝗠𝗔𝗡𝗗."
    );

    return true;
  }

  switch (OWNER_COMMANDS[command]) {

    case "showOwner":
      await send(
        sock,
        remoteJid,
        `👑 𝗤ᴜᴇᴇɴ X 𝗢𝗪𝗡𝗘𝗥

𝗡𝗮𝗺𝗲: ${config.owner?.name || process.env.OWNER_NAME || "Simon Tech"}
𝗡𝘂𝗺𝗯𝗲𝗿: ${process.env.OWNER_NUMBER || "Not configured"}`
      );
      break;

    case "ping":
      await send(
        sock,
        remoteJid,
        "🏓 𝗣𝗢𝗡𝗚!\n\n𝗤ᴜᴇᴇɴ X 𝗜𝗦 𝗢𝗡𝗟𝗜𝗡𝗘."
      );
      break;

    case "about":
      await send(
        sock,
        remoteJid,
        "👑 𝗤ᴜᴇᴇɴ X\n\n𝗪𝗵𝗮𝘁𝘀𝗔𝗽𝗽 𝗠𝗗 𝗕𝗼𝘁\n𝗕𝘂𝗶𝗹𝘁 𝗯𝘆 𝗦𝗶𝗺𝗼𝗻 𝗧𝗲𝗰𝗵"
      );
      break;

    case "menu":
      await send(
        sock,
        remoteJid,
        "𝗧𝗬𝗣𝗘 `.menu` 𝗧𝗢 𝗢𝗣𝗘𝗡 𝗧𝗛𝗘 𝗠𝗔𝗜𝗡 𝗠𝗘𝗡𝗨."
      );
      break;

    default:
      await send(
        sock,
        remoteJid,
        `⚙️ 𝗢𝗪𝗡𝗘𝗥 𝗖𝗢𝗠𝗠𝗔𝗡𝗗

𝗖𝗢𝗠𝗠𝗔𝗡𝗗: .${command}
𝗔𝗥𝗚𝗦: ${args.join(" ") || "None"}

𝗧𝗛𝗜𝗦 𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗜𝗦 𝗥𝗘𝗚𝗜𝗦𝗧𝗘𝗥𝗘𝗗 𝗔𝗡𝗗 𝗥𝗘𝗔𝗗𝗬 𝗙𝗢𝗥 𝗜𝗧𝗦 𝗙𝗨𝗟𝗟 𝗛𝗔𝗡𝗗𝗟𝗘𝗥.`
      );
      break;
  }

  return true;
}

module.exports = {
  name: "owner",
  aliases: ["ownermenu"],
  commands: OWNER_COMMANDS,
  handleOwnerCommand
};
