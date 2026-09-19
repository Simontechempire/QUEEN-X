const SECURITY_COMMANDS = [
  "security",
  "secure",
  "antispam",
  "antiflood",
  "antilink",
  "antibot",
  "antidelete",
  "antitag",
  "antimention",
  "antiscam",
  "antiraid",
  "antivirus",
  "lockbot",
  "unlockbot",
  "protect",
  "unprotect",
  "block",
  "unblock",
  "blocked",
  "blocklist",
  "whitelist",
  "blacklist",
  "addwhitelist",
  "delwhitelist",
  "addblacklist",
  "delblacklist",
  "securitylog",
  "clearsecurity",
  "securitystatus",
  "setsecurity",
  "resetsecurity",
  "detectlink",
  "detectspam",
  "detectbot",
  "detectscam",
  "detectraid",
  "warnuser",
  "muteuser",
  "kickuser",
  "securitycheck",
  "scan",
  "scanuser",
  "scangroup",
  "groupsecurity",
  "privacy",
  "privacycheck",
  "sessioncheck",
  "devicecheck",
  "securityinfo",
  "securityhelp"
];

const SECURITY_MENU = `
🌍⃝⃘‌‌‌━⋆─⋆──❂
┊ ┊ ┊ ┊ ┊
┊ ┊ ✫ ˚㋛ ⋆｡ ❀
┊ ☠︎︎
✧  x security 𓂃✍︎𝄞
╰────────────────❂

┏━━━━━━━━━━━━━━━━━━━━━━❥❥❥
┃ 𝗤ᴜᴇᴇɴ X — 𝗦𝗘𝗖𝗨𝗥𝗜𝗧𝗬
┗━━━━━━━━━━━━━━━━━━━━━━❥❥❥

${SECURITY_COMMANDS.map(
  (cmd, i) =>
    `┃ ${String(i + 1).padStart(2, "0")}. .${cmd}`
).join("\n")}

┗━━━━━━━━━━━━━━━━━━━━━━❥❥❥

𝗧𝗢𝗧𝗔𝗟: 𝟱𝟬 𝗦𝗘𝗖𝗨𝗥𝗜𝗧𝗬 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗦
`;

async function send(sock, jid, text) {
  return sock.sendMessage(jid, { text });
}

async function handleSecurityCommand({
  sock,
  remoteJid,
  command,
  args = []
}) {
  if (!SECURITY_COMMANDS.includes(command)) {
    return false;
  }

  if (
    command === "security" ||
    command === "securityhelp"
  ) {
    await send(sock, remoteJid, SECURITY_MENU);
    return true;
  }

  if (
    command === "securitystatus" ||
    command === "securityinfo"
  ) {
    await send(
      sock,
      remoteJid,
      `🛡️ 𝗤ᴜᴇᴇɴ X 𝗦𝗘𝗖𝗨𝗥𝗜𝗧𝗬

𝗔𝗡𝗧𝗜𝗦𝗣𝗔𝗠: 𝗢𝗙𝗙
𝗔𝗡𝗧𝗜𝗙𝗟𝗢𝗢𝗗: 𝗢𝗙𝗙
𝗔𝗡𝗧𝗜𝗟𝗜𝗡𝗞: 𝗢𝗙𝗙
𝗔𝗡𝗧𝗜𝗕𝗢𝗧: 𝗢𝗙𝗙
𝗔𝗡𝗧𝗜𝗗𝗘𝗟𝗘𝗧𝗘: 𝗢𝗙𝗙
𝗔𝗡𝗧𝗜𝗧𝗔𝗚: 𝗢𝗙𝗙

⚙️ 𝗦𝗘𝗖𝗨𝗥𝗜𝗧𝗬 𝗛𝗔𝗡𝗗𝗟𝗘𝗥 𝗢𝗡𝗟𝗜𝗡𝗘.`
    );

    return true;
  }

  if (
    command.startsWith("detect") ||
    command === "scan" ||
    command === "securitycheck"
  ) {
    await send(
      sock,
      remoteJid,
      `🔍 𝗦𝗘𝗖𝗨𝗥𝗜𝗧𝗬 𝗦𝗖𝗔𝗡

𝗖𝗢𝗠𝗠𝗔𝗡𝗗:
.${command}

𝗧𝗔𝗥𝗚𝗘𝗧:
${args.join(" ") || "Current chat"}

⏳ 𝗦𝗖𝗔𝗡 𝗛𝗔𝗡𝗗𝗟𝗘𝗥 𝗥𝗘𝗔𝗗𝗬.`
    );

    return true;
  }

  const value = args.join(" ").trim();

  await send(
    sock,
    remoteJid,
    `🛡️ 𝗦𝗘𝗖𝗨𝗥𝗜𝗧𝗬 𝗖𝗢𝗠𝗠𝗔𝗡𝗗

𝗖𝗢𝗠𝗠𝗔𝗡𝗗:
.${command}

𝗔𝗥𝗚𝗨𝗠𝗘𝗡𝗧𝗦:
${value || "None"}

⚙️ 𝗦𝗘𝗖𝗨𝗥𝗜𝗧𝗬 𝗛𝗔𝗡𝗗𝗟𝗘𝗥 𝗥𝗘𝗔𝗗𝗬.`
  );

  return true;
}

module.exports = {
  name: "security",
  aliases: ["secure", "securitymenu"],
  commands: SECURITY_COMMANDS,
  handleSecurityCommand,

  execute: async ({
    sock,
    remoteJid
  }) => {
    await send(sock, remoteJid, SECURITY_MENU);
  }
};
