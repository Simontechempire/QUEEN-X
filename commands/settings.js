const SETTINGS_COMMANDS = [
  "settings",
  "setprefix",
  "prefix",
  "setname",
  "setbio",
  "setstatus",
  "setpp",
  "delpp",
  "autoread",
  "autotyping",
  "autorecording",
  "welcome",
  "goodbye",
  "antilink",
  "antispam",
  "antiflood",
  "antibot",
  "antitag",
  "antidelete",
  "public",
  "private",
  "mode",
  "setmode",
  "language",
  "timezone",
  "settimezone",
  "reset",
  "resetsettings",
  "getsettings",
  "botinfo",
  "botstatus",
  "maintenance",
  "setmaintenance",
  "commands",
  "setowner",
  "setcountry",
  "setlanguage",
  "setwelcome",
  "setgoodbye",
  "setfooter",
  "setmenu",
  "menustyle",
  "setemoji",
  "settheme",
  "setlogo",
  "setprefixhelp",
  "settingsinfo",
  "settingshelp"
];

const SETTINGS_MENU = `
🌍⃝⃘‌‌‌━⋆─⋆──❂
┊ ┊ ┊ ┊ ┊
┊ ┊ ✫ ˚㋛ ⋆｡ ❀
┊ ☠︎︎
✧  x settings 𓂃✍︎𝄞
╰────────────────❂

┏━━━━━━━━━━━━━━━━━━━━━━❥❥❥
┃ 𝗤ᴜᴇᴇɴ X — 𝗦𝗘𝗧𝗧𝗜𝗡𝗚𝗦
┗━━━━━━━━━━━━━━━━━━━━━━❥❥❥

${SETTINGS_COMMANDS.map(
  (cmd, i) =>
    `┃ ${String(i + 1).padStart(2, "0")}. .${cmd}`
).join("\n")}

┗━━━━━━━━━━━━━━━━━━━━━━❥❥❥

𝗧𝗢𝗧𝗔𝗟: 𝟱𝟬 𝗦𝗘𝗧𝗧𝗜𝗡𝗚𝗦 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗦
`;

async function send(sock, jid, text) {
  return sock.sendMessage(jid, { text });
}

async function handleSettingsCommand({
  sock,
  remoteJid,
  command,
  args = []
}) {
  if (!SETTINGS_COMMANDS.includes(command)) {
    return false;
  }

  if (
    command === "settings" ||
    command === "settingshelp"
  ) {
    await send(sock, remoteJid, SETTINGS_MENU);
    return true;
  }

  if (
    command === "getsettings" ||
    command === "settingsinfo"
  ) {
    await send(
      sock,
      remoteJid,
      `⚙️ 𝗤ᴜᴇᴇ𝗡 X 𝗦𝗘𝗧𝗧𝗜𝗡𝗚𝗦

𝗣𝗥𝗘𝗙𝗜𝗫: .
𝗔𝗨𝗧𝗢 𝗥𝗘𝗔𝗗: 𝗢𝗙𝗙
𝗔𝗨𝗧𝗢 𝗧𝗬𝗣𝗜𝗡𝗚: 𝗢𝗙𝗙
𝗔𝗨𝗧𝗢 𝗥𝗘𝗖𝗢𝗥𝗗𝗜𝗡𝗚: 𝗢𝗙𝗙
𝗠𝗢𝗗𝗘: 𝗣𝗨𝗕𝗟𝗜𝗖
𝗠𝗔𝗜𝗡𝗧𝗘𝗡𝗔𝗡𝗖𝗘: 𝗢𝗙𝗙`
    );

    return true;
  }

  const value = args.join(" ").trim();

  if (!value) {
    await send(
      sock,
      remoteJid,
      `❌ 𝗩𝗔𝗟𝗨𝗘 𝗥𝗘𝗤𝗨𝗜𝗥𝗘𝗗

𝗨𝘀𝗮𝗴𝗲:
.${command} value

𝗘𝘅𝗮𝗺𝗽𝗹𝗲:
.setprefix !
.setlanguage English
.settimezone Africa/Lagos`
    );

    return true;
  }

  await send(
    sock,
    remoteJid,
    `⚙️ 𝗦𝗘𝗧𝗧𝗜𝗡𝗚 𝗨𝗣𝗗𝗔𝗧𝗘

𝗖𝗢𝗠𝗠𝗔𝗡𝗗:
.${command}

𝗩𝗔𝗟𝗨𝗘:
${value}

✅ 𝗦𝗘𝗧𝗧𝗜𝗡𝗚 𝗥𝗘𝗤𝗨𝗘𝗦𝗧 𝗥𝗘𝗖𝗘𝗜𝗩𝗘𝗗.`
  );

  return true;
}

module.exports = {
  name: "settings",
  aliases: ["settingsmenu"],
  commands: SETTINGS_COMMANDS,
  handleSettingsCommand,

  execute: async ({
    sock,
    remoteJid
  }) => {
    await send(sock, remoteJid, SETTINGS_MENU);
  }
};
