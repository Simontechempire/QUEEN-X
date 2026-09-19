const UTILITY_COMMANDS = [
  "utility",
  "utils",
  "help",
  "ping",
  "alive",
  "runtime",
  "uptime",
  "botinfo",
  "status",
  "id",
  "jid",
  "userinfo",
  "profile",
  "mention",
  "tag",
  "quoted",
  "groupid",
  "chatid",
  "owner",
  "admins",
  "groupinfo",
  "members",
  "list",
  "time",
  "date",
  "timezone",
  "calc",
  "calculator",
  "count",
  "wordcount",
  "character",
  "reverse",
  "uppercase",
  "lowercase",
  "capitalize",
  "remove",
  "trim",
  "random",
  "choose",
  "number",
  "percentage",
  "timestamp",
  "format",
  "shorten",
  "qr",
  "qrcode",
  "encode",
  "decode",
  "utilityinfo",
  "utilityhelp"
];

const UTILITY_MENU = `
🌍⃝⃘‌‌‌━⋆─⋆──❂
┊ ┊ ┊ ┊ ┊
┊ ┊ ✫ ˚㋛ ⋆｡ ❀
┊ ☠︎︎
✧  x utility 𓂃✍︎𝄞
╰────────────────❂

┏━━━━━━━━━━━━━━━━━━━━━━❥❥❥
┃ 𝗤ᴜᴇᴇɴ X — 𝗨𝗧𝗜𝗟𝗜𝗧𝗬
┗━━━━━━━━━━━━━━━━━━━━━━❥❥❥

${UTILITY_COMMANDS.map(
  (cmd, i) =>
    `┃ ${String(i + 1).padStart(2, "0")}. .${cmd}`
).join("\n")}

┗━━━━━━━━━━━━━━━━━━━━━━❥❥❥

𝗧𝗢𝗧𝗔𝗟: 𝟱𝟬 𝗨𝗧𝗜𝗟𝗜𝗧𝗬 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗦
`;

async function send(sock, jid, text) {
  return sock.sendMessage(jid, { text });
}

async function handleUtilityCommand({
  sock,
  remoteJid,
  command,
  args = [],
  message
}) {
  if (!UTILITY_COMMANDS.includes(command)) {
    return false;
  }

  if (
    command === "utility" ||
    command === "utils" ||
    command === "utilityhelp"
  ) {
    await send(sock, remoteJid, UTILITY_MENU);
    return true;
  }

  switch (command) {
    case "ping": {
      const start = Date.now();

      await send(
        sock,
        remoteJid,
        `🏓 𝗣𝗢𝗡𝗚!

⚡ 𝗥𝗘𝗦𝗣𝗢𝗡𝗦𝗘: ${Date.now() - start}ms`
      );
      break;
    }

    case "alive":
      await send(
        sock,
        remoteJid,
        `🟢 𝗤ᴜᴇᴇɴ X 𝗜𝗦 𝗔𝗟𝗜𝗩𝗘

🤖 𝗦𝗧𝗔𝗧𝗨𝗦: 𝗢𝗡𝗟𝗜𝗡𝗘
⚙️ 𝗠𝗢𝗗𝗘: 𝗣𝗥𝗢𝗗𝗨𝗖𝗧𝗜𝗢𝗡`
      );
      break;

    case "runtime":
    case "uptime": {
      const seconds = Math.floor(
        process.uptime()
      );

      const days = Math.floor(
        seconds / 86400
      );

      const hours = Math.floor(
        (seconds % 86400) / 3600
      );

      const minutes = Math.floor(
        (seconds % 3600) / 60
      );

      const secs = seconds % 60;

      await send(
        sock,
        remoteJid,
        `⏱️ 𝗥𝗨𝗡𝗧𝗜𝗠𝗘

${days}d ${hours}h ${minutes}m ${secs}s`
      );
      break;
    }

    case "botinfo":
    case "status":
      await send(
        sock,
        remoteJid,
        `🤖 𝗤ᴜᴇᴇɴ X

𝗦𝗧𝗔𝗧𝗨𝗦: 🟢 𝗢𝗡𝗟𝗜𝗡𝗘
𝗥𝗨𝗡𝗧𝗜𝗠𝗘: ${Math.floor(
          process.uptime()
        )}s
𝗡𝗢𝗗𝗘: ${process.version}
𝗣𝗟𝗔𝗧𝗙𝗢𝗥𝗠: ${process.platform}`
      );
      break;

    case "id":
    case "jid":
    case "chatid":
    case "groupid":
      await send(
        sock,
        remoteJid,
        `🆔 𝗖𝗛𝗔𝗧 𝗜𝗗

${remoteJid}`
      );
      break;

    case "time":
    case "date":
    case "timezone":
      await send(
        sock,
        remoteJid,
        `🕐 𝗦𝗘𝗥𝗩𝗘𝗥 𝗧𝗜𝗠𝗘

${new Date().toString()}`
      );
      break;

    case "count":
    case "wordcount":
    case "character": {
      const text = args.join(" ");

      await send(
        sock,
        remoteJid,
        `🔢 𝗧𝗘𝗫𝗧 𝗦𝗧𝗔𝗧𝗦

𝗪𝗢𝗥𝗗𝗦: ${
          text.trim()
            ? text.trim().split(/\s+/).length
            : 0
        }
𝗖𝗛𝗔𝗥𝗔𝗖𝗧𝗘𝗥𝗦: ${[...text].length}`
      );
      break;
    }

    case "uppercase":
      await send(
        sock,
        remoteJid,
        args.join(" ").toUpperCase() ||
          "❌ 𝗧𝗘𝗫𝗧 𝗥𝗘𝗤𝗨𝗜𝗥𝗘𝗗."
      );
      break;

    case "lowercase":
      await send(
        sock,
        remoteJid,
        args.join(" ").toLowerCase() ||
          "❌ 𝗧𝗘𝗫𝗧 𝗥𝗘𝗤𝗨𝗜𝗥𝗘𝗗."
      );
      break;

    case "capitalize": {
      const text = args.join(" ");

      if (!text) {
        await send(
          sock,
          remoteJid,
          "❌ 𝗧𝗘𝗫𝗧 𝗥𝗘𝗤𝗨𝗜𝗥𝗘𝗗."
        );
        break;
      }

      await send(
        sock,
        remoteJid,
        text
          .toLowerCase()
          .replace(/\b\w/g, char =>
            char.toUpperCase()
          )
      );
      break;
    }

    case "reverse": {
      const text = args.join(" ");

      if (!text) {
        await send(
          sock,
          remoteJid,
          "❌ 𝗧𝗘𝗫𝗧 𝗥𝗘𝗤𝗨𝗜𝗥𝗘𝗗."
        );
        break;
      }

      await send(
        sock,
        remoteJid,
        [...text].reverse().join("")
      );
      break;
    }

    case "random": {
      const min = Number(args[0]) || 1;
      const max = Number(args[1]) || 100;

      const result =
        Math.floor(
          Math.random() *
          (max - min + 1)
        ) + min;

      await send(
        sock,
        remoteJid,
        `🎲 𝗥𝗔𝗡𝗗𝗢𝗠

${result}`
      );
      break;
    }

    case "choose":
      if (args.length < 2) {
        await send(
          sock,
          remoteJid,
          "❌ 𝗘𝗫𝗔𝗠𝗣𝗟𝗘: .choose red blue"
        );
        break;
      }

      await send(
        sock,
        remoteJid,
        `🎯 𝗖𝗛𝗢𝗦𝗘𝗡:

${args[Math.floor(
          Math.random() * args.length
        )]}`
      );
      break;

    case "timestamp":
      await send(
        sock,
        remoteJid,
        `⏱️ 𝗨𝗡𝗜𝗫 𝗧𝗜𝗠𝗘𝗦𝗧𝗔𝗠𝗣

${Math.floor(Date.now() / 1000)}`
      );
      break;

    default:
      await send(
        sock,
        remoteJid,
        `🔧 𝗨𝗧𝗜𝗟𝗜𝗧𝗬 𝗖𝗢𝗠𝗠𝗔𝗡𝗗

𝗖𝗢𝗠𝗠𝗔𝗡𝗗:
.${command}

𝗔𝗥𝗚𝗦:
${args.join(" ") || "None"}

⚙️ 𝗨𝗧𝗜𝗟𝗜𝗧𝗬 𝗛𝗔𝗡𝗗𝗟𝗘𝗥 𝗥𝗘𝗔𝗗𝗬.`
      );
  }

  return true;
}

module.exports = {
  name: "utility",
  aliases: ["utils", "utilitymenu"],
  commands: UTILITY_COMMANDS,
  handleUtilityCommand,

  execute: async ({
    sock,
    remoteJid
  }) => {
    await send(
      sock,
      remoteJid,
      UTILITY_MENU
    );
  }
};
