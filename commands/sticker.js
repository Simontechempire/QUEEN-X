const STICKER_COMMANDS = [
  "sticker",
  "s",
  "stiker",
  "stickerize",
  "toimg",
  "toimage",
  "tosticker",
  "stickerpack",
  "pack",
  "take",
  "steal",
  "wm",
  "stickerwm",
  "circle",
  "crop",
  "stickertext",
  "textsticker",
  "emoji",
  "emojisticker",
  "gifsticker",
  "videosticker",
  "audiosticker",
  "stickerinfo",
  "stickerid",
  "stickersearch",
  "stickerfind",
  "randomsticker",
  "mysticker",
  "stickername",
  "setpack",
  "setauthor",
  "setname",
  "delpack",
  "packinfo",
  "animated",
  "static",
  "resize",
  "stickerresize",
  "stickerconvert",
  "webpsticker",
  "pngsticker",
  "jpgsticker",
  "stickerhelp",
  "stickeradd",
  "stickerdel",
  "stickerlist",
  "stickerdownload",
  "stickerupload",
  "stickerstatus",
  "stickerreset"
];

const STICKER_MENU = `
🌍⃝⃘‌‌‌━⋆─⋆──❂
┊ ┊ ┊ ┊ ┊
┊ ┊ ✫ ˚㋛ ⋆｡ ❀
┊ ☠︎︎
✧  x sticker 𓂃✍︎𝄞
╰────────────────❂

┏━━━━━━━━━━━━━━━━━━━━━━❥❥❥
┃ 𝗤ᴜᴇᴇɴ X — 𝗦𝗧𝗜𝗖𝗞𝗘𝗥
┗━━━━━━━━━━━━━━━━━━━━━━❥❥❥

${STICKER_COMMANDS.map(
  (cmd, i) =>
    `┃ ${String(i + 1).padStart(2, "0")}. .${cmd}`
).join("\n")}

┗━━━━━━━━━━━━━━━━━━━━━━❥❥❥

𝗧𝗢𝗧𝗔𝗟: 𝟱𝟬 𝗦𝗧𝗜𝗖𝗞𝗘𝗥 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗦
`;

async function send(sock, jid, text) {
  return sock.sendMessage(jid, { text });
}

function hasQuotedMedia(message) {
  const quoted =
    message?.message?.extendedTextMessage
      ?.contextInfo?.quotedMessage;

  return Boolean(
    quoted?.imageMessage ||
    quoted?.videoMessage ||
    quoted?.stickerMessage
  );
}

function hasDirectMedia(message) {
  const content = message?.message;

  return Boolean(
    content?.imageMessage ||
    content?.videoMessage ||
    content?.stickerMessage
  );
}

async function handleStickerCommand({
  sock,
  remoteJid,
  command,
  args = [],
  message
}) {
  if (!STICKER_COMMANDS.includes(command)) {
    return false;
  }

  if (
    command === "sticker" ||
    command === "s" ||
    command === "stickerhelp"
  ) {
    await send(sock, remoteJid, STICKER_MENU);
    return true;
  }

  const hasMedia =
    hasDirectMedia(message) ||
    hasQuotedMedia(message);

  if (
    [
      "stickerize",
      "stiker",
      "tosticker",
      "gifsticker",
      "videosticker",
      "resize",
      "stickerresize",
      "stickerconvert",
      "webpsticker",
      "pngsticker",
      "jpgsticker"
    ].includes(command) &&
    !hasMedia
  ) {
    await send(
      sock,
      remoteJid,
      `❌ 𝗠𝗘𝗗𝗜𝗔 𝗥𝗘𝗤𝗨𝗜𝗥𝗘𝗗

𝗥𝗘𝗣𝗟𝗬 𝗧𝗢 𝗔𝗡 𝗜𝗠𝗔𝗚𝗘 𝗢𝗥 𝗩𝗜𝗗𝗘𝗢 𝗪𝗜𝗧𝗛:

.${command}`
    );

    return true;
  }

  switch (command) {
    case "stickerize":
    case "stiker":
    case "tosticker":
      await send(
        sock,
        remoteJid,
        `🎨 𝗦𝗧𝗜𝗖𝗞𝗘𝗥 𝗥𝗘𝗤𝗨𝗘𝗦𝗧

⏳ 𝗠𝗘𝗗𝗜𝗔 𝗗𝗘𝗧𝗘𝗖𝗧𝗘𝗗
⚙️ 𝗦𝗧𝗜𝗖𝗞𝗘𝗥 𝗣𝗥𝗢𝗖𝗘𝗦𝗦𝗜𝗡𝗚 𝗪𝗜𝗟𝗟 𝗕𝗘 𝗖𝗢𝗡𝗡𝗘𝗖𝗧𝗘𝗗 𝗛𝗘𝗥𝗘.`
      );
      break;

    case "take":
    case "steal": {
      const pack =
        args[0] || "𝗤ᴜᴇᴇɴ X";

      const author =
        args.slice(1).join(" ") ||
        "Simon Tech";

      await send(
        sock,
        remoteJid,
        `🏷️ 𝗦𝗧𝗜𝗖𝗞𝗘𝗥 𝗣𝗔𝗖𝗞

𝗣𝗔𝗖𝗞: ${pack}
𝗔𝗨𝗧𝗛𝗢𝗥: ${author}

⚙️ 𝗣𝗔𝗖𝗞 𝗦𝗘𝗧𝗧𝗜𝗡𝗚𝗦 𝗥𝗘𝗖𝗘𝗜𝗩𝗘𝗗.`
      );
      break;
    }

    case "setpack":
    case "setauthor":
    case "setname":
      await send(
        sock,
        remoteJid,
        `🏷️ 𝗦𝗧𝗜𝗖𝗞𝗘𝗥 𝗦𝗘𝗧𝗧𝗜𝗡𝗚

𝗖𝗢𝗠𝗠𝗔𝗡𝗗: .${command}

𝗩𝗔𝗟𝗨𝗘:
${args.join(" ") || "None"}`
      );
      break;

    case "packinfo":
    case "stickerinfo":
    case "stickerid":
      await send(
        sock,
        remoteJid,
        `📦 𝗦𝗧𝗜𝗖𝗞𝗘𝗥 𝗜𝗡𝗙𝗢

𝗖𝗢𝗠𝗠𝗔𝗡𝗗: .${command}

⚙️ 𝗜𝗡𝗙𝗢 𝗛𝗔𝗡𝗗𝗟𝗘𝗥 𝗥𝗘𝗔𝗗𝗬.`
      );
      break;

    case "randomsticker":
    case "stickersearch":
    case "stickerfind":
      await send(
        sock,
        remoteJid,
        `🔎 𝗦𝗧𝗜𝗖𝗞𝗘𝗥 𝗦𝗘𝗔𝗥𝗖𝗛

𝗤𝗨𝗘𝗥𝗬:
${args.join(" ") || "Random"}

⏳ 𝗦𝗘𝗔𝗥𝗖𝗛 𝗣𝗥𝗢𝗩𝗜𝗗𝗘𝗥 𝗪𝗜𝗟𝗟 𝗕𝗘 𝗖𝗢𝗡𝗡𝗘𝗖𝗧𝗘𝗗 𝗛𝗘𝗥𝗘.`
      );
      break;

    case "stickerlist":
    case "mysticker":
      await send(
        sock,
        remoteJid,
        `📋 𝗦𝗧𝗜𝗖𝗞𝗘𝗥 𝗟𝗜𝗦𝗧

𝗡𝗼 𝗽𝗲𝗿𝘀𝗶𝘀𝘁𝗲𝗻𝘁 𝘀𝘁𝗶𝗰𝗸𝗲𝗿 𝗹𝗶𝘀𝘁 𝗵𝗮𝘀 𝗯𝗲𝗲𝗻 𝗰𝗼𝗻𝗳𝗶𝗴𝘂𝗿𝗲𝗱 𝘆𝗲𝘁.`
      );
      break;

    default:
      await send(
        sock,
        remoteJid,
        `🎨 𝗦𝗧𝗜𝗖𝗞𝗘𝗥 𝗖𝗢𝗠𝗠𝗔𝗡𝗗

𝗖𝗢𝗠𝗠𝗔𝗡𝗗: .${command}

𝗔𝗥𝗚𝗦:
${args.join(" ") || "None"}

⚙️ 𝗦𝗧𝗜𝗖𝗞𝗘𝗥 𝗛𝗔𝗡𝗗𝗟𝗘𝗥 𝗥𝗘𝗔𝗗𝗬.`
      );
  }

  return true;
}

module.exports = {
  name: "sticker",
  aliases: ["stickermenu"],
  commands: STICKER_COMMANDS,
  handleStickerCommand,

  execute: async ({
    sock,
    remoteJid
  }) => {
    await send(
      sock,
      remoteJid,
      STICKER_MENU
    );
  }
};
