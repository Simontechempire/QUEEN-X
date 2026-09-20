const TOOLS_COMMANDS = [
  "tools",
  "calculator",
  "calc",
  "convert",
  "unit",
  "currency",
  "weather",
  "time",
  "date",
  "translate",
  "shorturl",
  "qr",
  "qrcode",
  "barcode",
  "base64",
  "encode",
  "decode",
  "urlencode",
  "urldecode",
  "hash",
  "md5",
  "sha256",
  "uuid",
  "random",
  "password",
  "color",
  "hex",
  "binary",
  "octal",
  "hextobin",
  "bintohex",
  "json",
  "jsonformat",
  "jsonminify",
  "regex",
  "timestamp",
  "unix",
  "ip",
  "dns",
  "ping",
  "port",
  "whois",
  "headers",
  "userinfo",
  "number",
  "percentage",
  "age",
  "count",
  "reverse",
  "toolhelp"
];

const TOOLS_MENU = `
🌍⃝⃘‌‌‌━⋆─⋆──❂
┊ ┊ ┊ ┊ ┊
┊ ┊ ✫ ˚㋛ ⋆｡ ❀
┊ ☠︎︎
✧  x tools 𓂃✍︎𝄞
╰────────────────❂

┏━━━━━━━━━━━━━━━━━━━━━━❥❥❥
┃ 𝗤ᴜᴇᴇɴ X — 𝗧𝗢𝗢𝗟𝗦
┗━━━━━━━━━━━━━━━━━━━━━━❥❥❥

${TOOLS_COMMANDS.map(
  (cmd, i) =>
    `┃ ${String(i + 1).padStart(2, "0")}. .${cmd}`
).join("\n")}

┗━━━━━━━━━━━━━━━━━━━━━━❥❥❥

𝗧𝗢𝗧𝗔𝗟: 𝟱𝟬 𝗧𝗢𝗢𝗟𝗦 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗦
`;

async function send(sock, jid, text) {
  return sock.sendMessage(jid, { text });
}

function getNumber(args = []) {
  return Number(args[0]);
}

async function handleToolsCommand({
  sock,
  remoteJid,
  command,
  args = []
}) {
  if (!TOOLS_COMMANDS.includes(command)) {
    return false;
  }

  if (
    command === "tools" ||
    command === "toolhelp"
  ) {
    await send(sock, remoteJid, TOOLS_MENU);
    return true;
  }

  switch (command) {

    case "calculator":
    case "calc": {
      const expression = args.join(" ");

      if (!expression) {
        await send(
          sock,
          remoteJid,
          "❌ 𝗘𝗡𝗧𝗘𝗥 𝗔 𝗖𝗔𝗟𝗖𝗨𝗟𝗔𝗧𝗜𝗢𝗡.\n\n𝗘𝘅𝗮𝗺𝗽𝗹𝗲: .calc 25 * 4"
        );
        break;
      }

      // Only allow basic arithmetic characters.
      if (!/^[0-9+\-*/().%\s]+$/.test(expression)) {
        await send(
          sock,
          remoteJid,
          "❌ 𝗢𝗡𝗟𝗬 𝗕𝗔𝗦𝗜𝗖 𝗠𝗔𝗧𝗛 𝗘𝗫𝗣𝗥𝗘𝗦𝗦𝗜𝗢𝗡𝗦 𝗔𝗥𝗘 𝗔𝗟𝗟𝗢𝗪𝗘𝗗."
        );
        break;
      }

      try {
        const result = Function(
          `"use strict"; return (${expression})`
        )();

        await send(
          sock,
          remoteJid,
          `🧮 𝗖𝗔𝗟𝗖𝗨𝗟𝗔𝗧𝗢𝗥

𝗘𝗫𝗣𝗥𝗘𝗦𝗦𝗜𝗢𝗡:
${expression}

𝗥𝗘𝗦𝗨𝗟𝗧:
${result}`
        );
      } catch {
        await send(
          sock,
          remoteJid,
          "❌ 𝗜𝗡𝗩𝗔𝗟𝗜𝗗 𝗖𝗔𝗟𝗖𝗨𝗟𝗔𝗧𝗜𝗢𝗡."
        );
      }

      break;
    }

    case "percentage": {
      const value = Number(args[0]);
      const percent = Number(args[1]);

      if (
        !Number.isFinite(value) ||
        !Number.isFinite(percent)
      ) {
        await send(
          sock,
          remoteJid,
          "❌ 𝗨𝗦𝗔𝗚𝗘: .percentage 500 10"
        );
        break;
      }

      const result =
        (value * percent) / 100;

      await send(
        sock,
        remoteJid,
        `📊 𝗣𝗘𝗥𝗖𝗘𝗡𝗧𝗔𝗚𝗘

${percent}% 𝗢𝗙 ${value}
= ${result}`
      );

      break;
    }

    case "random": {
      const min = Number(args[0]) || 1;
      const max = Number(args[1]) || 100;

      if (min > max) {
        await send(
          sock,
          remoteJid,
          "❌ 𝗠𝗜𝗡 𝗖𝗔𝗡𝗡𝗢𝗧 𝗕𝗘 𝗚𝗥𝗘𝗔𝗧𝗘𝗥 𝗧𝗛𝗔𝗡 𝗠𝗔𝗫."
        );
        break;
      }

      const result =
        Math.floor(
          Math.random() *
          (max - min + 1)
        ) + min;

      await send(
        sock,
        remoteJid,
        `🎲 𝗥𝗔𝗡𝗗𝗢𝗠 𝗡𝗨𝗠𝗕𝗘𝗥

𝗥𝗔𝗡𝗚𝗘: ${min} - ${max}
𝗥𝗘𝗦𝗨𝗟𝗧: ${result}`
      );

      break;
    }

    case "uuid": {
      const uuid =
        typeof crypto !== "undefined" &&
        crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()
              .toString(16)
              .slice(2)}`;

      await send(
        sock,
        remoteJid,
        `🆔 𝗥𝗔𝗡𝗗𝗢𝗠 𝗜𝗗

${uuid}`
      );

      break;
    }

    case "reverse": {
      const text = args.join(" ");

      if (!text) {
        await send(
          sock,
          remoteJid,
          "❌ 𝗨𝗦𝗔𝗚𝗘: .reverse hello"
        );
        break;
      }

      await send(
        sock,
        remoteJid,
        `🔄 𝗥𝗘𝗩𝗘𝗥𝗦𝗘

${[...text].reverse().join("")}`
      );

      break;
    }

    case "count": {
      const text = args.join(" ");

      await send(
        sock,
        remoteJid,
        `🔢 𝗖𝗢𝗨𝗡𝗧

𝗖𝗛𝗔𝗥𝗔𝗖𝗧𝗘𝗥𝗦: ${[...text].length}
𝗪𝗢𝗥𝗗𝗦: ${
          text.trim()
            ? text.trim().split(/\s+/).length
            : 0
        }`
      );

      break;
    }

    case "base64":
    case "encode": {
      const text = args.join(" ");

      if (!text) {
        await send(
          sock,
          remoteJid,
          "❌ 𝗨𝗦𝗔𝗚𝗘: .base64 hello world"
        );
        break;
      }

      const encoded =
        Buffer.from(text, "utf8")
          .toString("base64");

      await send(
        sock,
        remoteJid,
        `🔐 𝗕𝗔𝗦𝗘𝟲𝟰

𝗥𝗘𝗦𝗨𝗟𝗧:
${encoded}`
      );

      break;
    }

    case "decode":
      try {
        const decoded =
          Buffer.from(
            args.join(" "),
            "base64"
          ).toString("utf8");

        await send(
          sock,
          remoteJid,
          `🔓 𝗗𝗘𝗖𝗢𝗗𝗘𝗗

${decoded}`
        );
      } catch {
        await send(
          sock,
          remoteJid,
          "❌ 𝗜𝗡𝗩𝗔𝗟𝗜𝗗 𝗕𝗔𝗦𝗘𝟲𝟰."
        );
      }
      break;

    case "timestamp":
    case "unix": {
      const timestamp =
        Math.floor(Date.now() / 1000);

      await send(
        sock,
        remoteJid,
        `⏱️ 𝗨𝗡𝗜𝗫 𝗧𝗜𝗠𝗘𝗦𝗧𝗔𝗠𝗣

${timestamp}`
      );

      break;
    }

    case "date":
    case "time": {
      await send(
        sock,
        remoteJid,
        `🕐 𝗦𝗘𝗥𝗩𝗘𝗥 𝗧𝗜𝗠𝗘

${new Date().toString()}`
      );

      break;
    }

    default:
      await send(
        sock,
        remoteJid,
        `🔧 𝗧𝗢𝗢𝗟 𝗖𝗢𝗠𝗠𝗔𝗡𝗗

𝗖𝗢𝗠𝗠𝗔𝗡𝗗: .${command}

𝗔𝗥𝗚𝗦: ${
          args.join(" ") || "None"
        }

⚙️ 𝗧𝗢𝗢𝗟 𝗛𝗔𝗡𝗗𝗟𝗘𝗥 𝗥𝗘𝗔𝗗𝗬.`
      );
  }

  return true;
}

module.exports = {
  name: "tools",
  aliases: ["toolsmenu"],
  commands: TOOLS_COMMANDS,
  handleToolsCommand,

  execute: async ({
    sock,
    remoteJid
  }) => {
    await send(
      sock,
      remoteJid,
      TOOLS_MENU
    );
  }
};
