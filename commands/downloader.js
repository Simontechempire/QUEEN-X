const DOWNLOADER_COMMANDS = [
  "download",
  "downloader",
  "ytmp3",
  "ytmp4",
  "youtube",
  "ytaudio",
  "ytvideo",
  "play",
  "song",
  "video",
  "tiktok",
  "tt",
  "ttmp3",
  "ttvideo",
  "instagram",
  "ig",
  "igdl",
  "facebook",
  "fb",
  "fbdl",
  "twitter",
  "xdl",
  "twitterdl",
  "threads",
  "threaddl",
  "pinterest",
  "pindl",
  "mediafire",
  "mf",
  "drive",
  "gdrive",
  "mega",
  "apk",
  "github",
  "gitclone",
  "soundcloud",
  "scdl",
  "spotify",
  "spdl",
  "document",
  "direct",
  "url",
  "fetch",
  "downloadurl",
  "save",
  "getmedia",
  "dl",
  "dler",
  "downloadhelp"
];

const DOWNLOADER_MENU = `
🌍⃝⃘‌‌‌━⋆─⋆──❂
┊ ┊ ┊ ┊ ┊
┊ ┊ ✫ ˚㋛ ⋆｡ ❀
┊ ☠︎︎
✧  x downloader 𓂃✍︎𝄞
╰────────────────❂

┏━━━━━━━━━━━━━━━━━━━━━━❥❥❥
┃ 𝗤ᴜᴇᴇɴ X — 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗥
┗━━━━━━━━━━━━━━━━━━━━━━❥❥❥

${DOWNLOADER_COMMANDS.map(
  (cmd, i) =>
    `┃ ${String(i + 1).padStart(2, "0")}. .${cmd}`
).join("\n")}

┗━━━━━━━━━━━━━━━━━━━━━━❥❥❥

𝗧𝗢𝗧𝗔𝗟: 𝟱𝟬 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗥 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗦
`;

async function send(sock, jid, text) {
  return sock.sendMessage(jid, { text });
}

function getUrl(args = []) {
  return args.find(arg =>
    /^https?:\/\//i.test(arg)
  );
}

async function handleDownloaderCommand({
  sock,
  remoteJid,
  command,
  args = []
}) {
  if (!DOWNLOADER_COMMANDS.includes(command)) {
    return false;
  }

  if (
    command === "download" ||
    command === "downloader" ||
    command === "downloadhelp"
  ) {
    await send(sock, remoteJid, DOWNLOADER_MENU);
    return true;
  }

  const url = getUrl(args);

  if (!url) {
    await send(
      sock,
      remoteJid,
      `❌ 𝗨𝗥𝗟 𝗥𝗘𝗤𝗨𝗜𝗥𝗘𝗗

𝗨𝘀𝗮𝗴𝗲:
.${command} https://example.com/link

𝗘𝘅𝗮𝗺𝗽𝗹𝗲:
.ytmp3 https://youtube.com/...`
    );

    return true;
  }

  await send(
    sock,
    remoteJid,
    `⏳ 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗 𝗥𝗘𝗤𝗨𝗘𝗦𝗧

𝗖𝗢𝗠𝗠𝗔𝗡𝗗: .${command}

𝗨𝗥𝗟:
${url}

🔄 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗 𝗣𝗥𝗢𝗖𝗘𝗦𝗦𝗜𝗡𝗚 𝗪𝗜𝗟𝗟 𝗕𝗘 𝗖𝗢𝗡𝗡𝗘𝗖𝗧𝗘𝗗 𝗛𝗘𝗥𝗘.`
  );

  return true;
}

module.exports = {
  name: "downloader",
  aliases: ["dl", "downloadmenu"],
  commands: DOWNLOADER_COMMANDS,
  handleDownloaderCommand,

  execute: async ({ sock, remoteJid }) => {
    await send(sock, remoteJid, DOWNLOADER_MENU);
  }
};
