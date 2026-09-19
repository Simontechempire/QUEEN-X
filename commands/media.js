const MEDIA_COMMANDS = [
  "media",
  "photo",
  "image",
  "video",
  "audio",
  "voice",
  "ptv",
  "gif",
  "document",
  "file",
  "sticker",
  "toimage",
  "tovideo",
  "toaudio",
  "tomp3",
  "compress",
  "resize",
  "crop",
  "rotate",
  "flipmedia",
  "mirror",
  "blur",
  "sharpen",
  "enhance",
  "brightness",
  "contrast",
  "saturation",
  "grayscale",
  "sepia",
  "invert",
  "caption",
  "watermark",
  "removebg",
  "background",
  "thumbnail",
  "cover",
  "qrmedia",
  "scan",
  "ocr",
  "readtext",
  "metadata",
  "mediainfo",
  "duration",
  "screenshots",
  "frames",
  "videogif",
  "gifvideo",
  "audiowave",
  "waveform",
  "mediahelp"
];

const MEDIA_MENU = `
🌍⃝⃘‌‌‌━⋆─⋆──❂
┊ ┊ ┊ ┊ ┊
┊ ┊ ✫ ˚㋛ ⋆｡ ❀
┊ ☠︎︎
✧  x media 𓂃✍︎𝄞
╰────────────────❂

┏━━━━━━━━━━━━━━━━━━━━━━❥❥❥
┃ 𝗤ᴜᴇᴇɴ X — 𝗠𝗘𝗗𝗜𝗔
┗━━━━━━━━━━━━━━━━━━━━━━❥❥❥

${MEDIA_COMMANDS.map(
  (cmd, i) =>
    `┃ ${String(i + 1).padStart(2, "0")}. .${cmd}`
).join("\n")}

┗━━━━━━━━━━━━━━━━━━━━━━❥❥❥

𝗧𝗢𝗧𝗔𝗟: 𝟱𝟬 𝗠𝗘𝗗𝗜𝗔 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗦
`;

async function send(sock, jid, text) {
  return sock.sendMessage(jid, { text });
}

async function handleMediaCommand({
  sock,
  remoteJid,
  command,
  args = [],
  message
}) {
  if (!MEDIA_COMMANDS.includes(command)) {
    return false;
  }

  if (command === "media" || command === "mediahelp") {
    await send(sock, remoteJid, MEDIA_MENU);
    return true;
  }

  const quoted =
    message?.message?.extendedTextMessage?.contextInfo
      ?.quotedMessage;

  const hasMedia =
    Boolean(quoted) ||
    Boolean(message?.message?.imageMessage) ||
    Boolean(message?.message?.videoMessage) ||
    Boolean(message?.message?.audioMessage) ||
    Boolean(message?.message?.documentMessage) ||
    Boolean(message?.message?.stickerMessage);

  if (!hasMedia) {
    await send(
      sock,
      remoteJid,
      `❌ 𝗠𝗘𝗗𝗜𝗔 𝗥𝗘𝗤𝗨𝗜𝗥𝗘𝗗

𝗖𝗢𝗠𝗠𝗔𝗡𝗗:
.${command}

𝗥𝗘𝗣𝗟𝗬 𝗧𝗢 𝗔 𝗦𝗨𝗣𝗣𝗢𝗥𝗧𝗘𝗗 𝗠𝗘𝗗𝗜𝗔 𝗙𝗜𝗟𝗘 𝗔𝗡𝗗 𝗧𝗥𝗬 𝗔𝗚𝗔𝗜𝗡.`
    );

    return true;
  }

  switch (command) {
    case "photo":
    case "image":
      await send(
        sock,
        remoteJid,
        "🖼️ 𝗜𝗠𝗔𝗚𝗘 𝗠𝗘𝗗𝗜𝗔 𝗗𝗘𝗧𝗘𝗖𝗧𝗘𝗗."
      );
      break;

    case "video":
    case "ptv":
      await send(
        sock,
        remoteJid,
        "🎬 𝗩𝗜𝗗𝗘𝗢 𝗠𝗘𝗗𝗜𝗔 𝗗𝗘𝗧𝗘𝗖𝗧𝗘𝗗."
      );
      break;

    case "audio":
    case "voice":
      await send(
        sock,
        remoteJid,
        "🎵 𝗔𝗨𝗗𝗜𝗢 𝗠𝗘𝗗𝗜𝗔 𝗗𝗘𝗧𝗘𝗖𝗧𝗘𝗗."
      );
      break;

    case "sticker":
      await send(
        sock,
        remoteJid,
        "🎨 𝗦𝗧𝗜𝗖𝗞𝗘𝗥 𝗖𝗢𝗡𝗩𝗘𝗥𝗦𝗜𝗢𝗡 𝗥𝗘𝗤𝗨𝗘𝗦𝗧 𝗥𝗘𝗖𝗘𝗜𝗩𝗘𝗗."
      );
      break;

    case "metadata":
    case "mediainfo":
      await send(
        sock,
        remoteJid,
        `📊 𝗠𝗘𝗗𝗜𝗔 𝗜𝗡𝗙𝗢

𝗖𝗢𝗠𝗠𝗔𝗡𝗗: .${command}
𝗔𝗥𝗚𝗦: ${args.join(" ") || "None"}

⚙️ 𝗠𝗘𝗗𝗜𝗔 𝗣𝗥𝗢𝗖𝗘𝗦𝗦𝗜𝗡𝗚 𝗛𝗔𝗡𝗗𝗟𝗘𝗥 𝗥𝗘𝗔𝗗𝗬.`
      );
      break;

    case "ocr":
    case "readtext":
      await send(
        sock,
        remoteJid,
        "🔎 𝗢𝗖𝗥 𝗥𝗘𝗤𝗨𝗘𝗦𝗧 𝗥𝗘𝗖𝗘𝗜𝗩𝗘𝗗."
      );
      break;

    default:
      await send(
        sock,
        remoteJid,
        `⚙️ 𝗠𝗘𝗗𝗜𝗔 𝗖𝗢𝗠𝗠𝗔𝗡𝗗

𝗖𝗢𝗠𝗠𝗔𝗡𝗗: .${command}
𝗔𝗥𝗚𝗦: ${args.join(" ") || "None"}

𝗠𝗘𝗗𝗜𝗔 𝗛𝗔𝗡𝗗𝗟𝗘𝗥 𝗥𝗘𝗔𝗗𝗬.`
      );
  }

  return true;
}

module.exports = {
  name: "media",
  aliases: ["mediamenu"],
  commands: MEDIA_COMMANDS,
  handleMediaCommand,

  execute: async ({ sock, remoteJid }) => {
    await send(sock, remoteJid, MEDIA_MENU);
  }
};
