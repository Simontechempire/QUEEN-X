const FUN_COMMANDS = [
  "fun",
  "joke",
  "meme",
  "roast",
  "compliment",
  "love",
  "ship",
  "lovecalc",
  "compatibility",
  "rate",
  "howcute",
  "howhot",
  "howhandsome",
  "howbeautiful",
  "truth",
  "dare",
  "truthordare",
  "wouldyourather",
  "wyr",
  "8ball",
  "fortune",
  "advice",
  "pickup",
  "flirt",
  "insult",
  "fact",
  "funfact",
  "quote",
  "motivate",
  "inspire",
  "emoji",
  "emojimix",
  "reverse",
  "mock",
  "say",
  "repeat",
  "choose",
  "random",
  "coin",
  "dice",
  "shipname",
  "nickname",
  "username",
  "fakechat",
  "story",
  "riddle",
  "challenge",
  "reaction",
  "funhelp"
];

const FUN_MENU = `
🌍⃝⃘‌‌‌━⋆─⋆──❂
┊ ┊ ┊ ┊ ┊
┊ ┊ ✫ ˚㋛ ⋆｡ ❀
┊ ☠︎︎
✧  x fun 𓂃✍︎𝄞
╰────────────────❂

┏━━━━━━━━━━━━━━━━━━━━━━❥❥❥
┃ 𝗤ᴜᴇᴇɴ X — 𝗙𝗨𝗡
┗━━━━━━━━━━━━━━━━━━━━━━❥❥❥

${FUN_COMMANDS.map(
  (cmd, i) =>
    `┃ ${String(i + 1).padStart(2, "0")}. .${cmd}`
).join("\n")}

┗━━━━━━━━━━━━━━━━━━━━━━❥❥❥

𝗧𝗢𝗧𝗔𝗟: 𝟱𝟬 𝗙𝗨𝗡 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗦
`;

async function send(sock, jid, text) {
  return sock.sendMessage(jid, { text });
}

function randomItem(array) {
  return array[
    Math.floor(Math.random() * array.length)
  ];
}

function getMentioned(message) {
  return (
    message?.message?.extendedTextMessage
      ?.contextInfo?.mentionedJid?.[0] ||
    message?.key?.participant ||
    null
  );
}

async function handleFunCommand({
  sock,
  remoteJid,
  command,
  args = [],
  message
}) {
  if (!FUN_COMMANDS.includes(command)) {
    return false;
  }

  if (
    command === "fun" ||
    command === "funhelp"
  ) {
    await send(sock, remoteJid, FUN_MENU);
    return true;
  }

  switch (command) {

    case "joke": {
      const jokes = [
        "𝗪𝗵𝘆 𝗱𝗶𝗱 𝘁𝗵𝗲 𝗽𝗿𝗼𝗴𝗿𝗮𝗺𝗺𝗲𝗿 𝗴𝗼 𝗯𝗿𝗼𝗸𝗲? 𝗕𝗲𝗰𝗮𝘂𝘀𝗲 𝗵𝗲 𝘂𝘀𝗲𝗱 𝘂𝗽 𝗮𝗹𝗹 𝗵𝗶𝘀 𝗰𝗮𝘀𝗵.",
        "𝗜 𝘁𝗼𝗹𝗱 𝗺𝘆 𝗰𝗼𝗺𝗽𝘂𝘁𝗲𝗿 𝗜 𝗻𝗲𝗲𝗱𝗲𝗱 𝗮 𝗯𝗿𝗲𝗮𝗸. 𝗡𝗼𝘄 𝗶𝘁 𝘄𝗼𝗻'𝘁 𝘀𝘁𝗼𝗽 𝘀𝗲𝗻𝗱𝗶𝗻𝗴 𝗺𝗲 𝗖𝗵𝗿𝗼𝗺𝗲 𝗻𝗼𝘁𝗶𝗳𝗶𝗰𝗮𝘁𝗶𝗼𝗻𝘀.",
        "𝗪𝗵𝗮𝘁 𝗱𝗼 𝘆𝗼𝘂 𝗰𝗮𝗹𝗹 𝟴 𝗯𝗶𝘁𝘀? 𝗔 𝗯𝘆𝘁𝗲!"
      ];

      await send(
        sock,
        remoteJid,
        `😂 𝗝𝗢𝗞𝗘\n\n${randomItem(jokes)}`
      );
      break;
    }

    case "meme":
      await send(
        sock,
        remoteJid,
        `😂 𝗠𝗘𝗠𝗘 𝗠𝗢𝗗𝗘

𝗪𝗵𝗲𝗻 𝘆𝗼𝘂 𝘀𝗮𝘆 "𝟱 𝗺𝗶𝗻𝘂𝘁𝗲𝘀"
𝗮𝗻𝗱 𝗶𝘁'𝘀 𝘀𝘁𝗶𝗹𝗹 𝟯 𝗵𝗼𝘂𝗿𝘀 𝗹𝗮𝘁𝗲𝗿. 😭`
      );
      break;

    case "compliment":
      await send(
        sock,
        remoteJid,
        `💖 𝗖𝗢𝗠𝗣𝗟𝗜𝗠𝗘𝗡𝗧

𝗬𝗼𝘂'𝗿𝗲 𝗺𝗼𝗿𝗲 𝗮𝗺𝗮𝘇𝗶𝗻𝗴 𝘁𝗵𝗮𝗻 𝘆𝗼𝘂 𝗴𝗶𝘃𝗲 𝘆𝗼𝘂𝗿𝘀𝗲𝗹𝗳 𝗰𝗿𝗲𝗱𝗶𝘁 𝗳𝗼𝗿. ✨`
      );
      break;

    case "love":
    case "lovecalc":
    case "compatibility": {
      const value = Math.floor(
        Math.random() * 101
      );

      await send(
        sock,
        remoteJid,
        `❤️ 𝗟𝗢𝗩𝗘 𝗖𝗔𝗟𝗖𝗨𝗟𝗔𝗧𝗢𝗥

𝗥𝗘𝗦𝗨𝗟𝗧: ${value}%

💕 𝗝𝘂𝘀𝘁 𝗳𝗼𝗿 𝗳𝘂𝗻!`
      );
      break;
    }

    case "rate":
    case "howcute":
    case "howhot":
    case "howhandsome":
    case "howbeautiful": {
      const value = Math.floor(
        Math.random() * 101
      );

      await send(
        sock,
        remoteJid,
        `⭐ 𝗥𝗔𝗧𝗜𝗡𝗚

𝗥𝗘𝗦𝗨𝗟𝗧: ${value}/100

😎 𝗧𝗵𝗶𝘀 𝗶𝘀 𝗷𝘂𝘀𝘁 𝗮 𝗳𝘂𝗻 𝗿𝗮𝗻𝗱𝗼𝗺 𝗿𝗮𝘁𝗶𝗻𝗴.`
      );
      break;
    }

    case "truth":
    case "dare":
    case "truthordare": {
      const truths = [
        "𝗪𝗵𝗮𝘁 𝗶𝘀 𝘆𝗼𝘂𝗿 𝗯𝗶𝗴𝗴𝗲𝘀𝘁 𝗱𝗿𝗲𝗮𝗺?",
        "𝗪𝗵𝗮𝘁 𝗶𝘀 𝘁𝗵𝗲 𝗳𝘂𝗻𝗻𝗶𝗲𝘀𝘁 𝘁𝗵𝗶𝗻𝗴 𝘆𝗼𝘂'𝘃𝗲 𝗱𝗼𝗻𝗲?"
      ];

      const dares = [
        "𝗦𝗲𝗻𝗱 𝗮 𝗳𝘂𝗻𝗻𝘆 𝗲𝗺𝗼𝗷𝗶 𝘁𝗼 𝘁𝗵𝗲 𝗴𝗿𝗼𝘂𝗽.",
        "𝗪𝗿𝗶𝘁𝗲 𝗮 𝘀𝗲𝗻𝘁𝗲𝗻𝗰𝗲 𝘄𝗶𝘁𝗵 𝟱 𝗲𝗺𝗼𝗷𝗶𝘀."
      ];

      const result =
        command === "dare"
          ? randomItem(dares)
          : randomItem(truths);

      await send(
        sock,
        remoteJid,
        `🎭 𝗧𝗥𝗨𝗧𝗛 𝗢𝗥 𝗗𝗔𝗥𝗘

${result}`
      );
      break;
    }

    case "8ball": {
      const answers = [
        "𝗬𝗘𝗦 ✨",
        "𝗡𝗢 ❌",
        "𝗠𝗔𝗬𝗕𝗘 🤔",
        "𝗔𝗦𝗞 𝗔𝗚𝗔𝗜𝗡 🔮",
        "𝗩𝗘𝗥𝗬 𝗟𝗜𝗞𝗘𝗟𝗬 💫",
        "𝗡𝗢𝗧 𝗟𝗜𝗞𝗘𝗟𝗬 🌙"
      ];

      await send(
        sock,
        remoteJid,
        `🎱 𝗠𝗔𝗚𝗜𝗖 𝟴 𝗕𝗔𝗟𝗟

${randomItem(answers)}`
      );
      break;
    }

    case "fortune":
      await send(
        sock,
        remoteJid,
        `🔮 𝗙𝗢𝗥𝗧𝗨𝗡𝗘

"${randomItem([
          "𝗚𝗿𝗲𝗮𝘁 𝘁𝗵𝗶𝗻𝗴𝘀 𝘁𝗮𝗸𝗲 𝘁𝗶𝗺𝗲.",
          "𝗧𝗼𝗱𝗮𝘆 𝗶𝘀 𝗮 𝗴𝗼𝗼𝗱 𝗱𝗮𝘆 𝘁𝗼 𝗹𝗲𝗮𝗿𝗻.",
          "𝗞𝗲𝗲𝗽 𝗴𝗼𝗶𝗻𝗴. 𝗬𝗼𝘂'𝗿𝗲 𝗴𝗲𝘁𝘁𝗶𝗻𝗴 𝗰𝗹𝗼𝘀𝗲𝗿."
        ])}"`
      );
      break;

    case "advice":
      await send(
        sock,
        remoteJid,
        `💡 𝗔𝗗𝗩𝗜𝗖𝗘

𝗗𝗼𝗻'𝘁 𝗰𝗼𝗺𝗽𝗮𝗿𝗲 𝘆𝗼𝘂𝗿 𝗯𝗲𝗴𝗶𝗻𝗻𝗶𝗻𝗴 𝘁𝗼 𝘀𝗼𝗺𝗲𝗼𝗻𝗲 𝗲𝗹𝘀𝗲'𝘀 𝗺𝗶𝗱𝗱𝗹𝗲.`
      );
      break;

    case "quote":
    case "motivate":
    case "inspire":
      await send(
        sock,
        remoteJid,
        `✨ 𝗤ᴜᴏᴛᴇ

"${randomItem([
          "𝗞𝗲𝗲𝗽 𝗺𝗼𝘃𝗶𝗻𝗴 𝗳𝗼𝗿𝘄𝗮𝗿𝗱.",
          "𝗦𝗺𝗮𝗹𝗹 𝘀𝘁𝗲𝗽𝘀 𝘀𝘁𝗶𝗹𝗹 𝗺𝗼𝘃𝗲 𝘆𝗼𝘂 𝗳𝗼𝗿𝘄𝗮𝗿𝗱.",
          "𝗬𝗼𝘂𝗿 𝗳𝘂𝘁𝘂𝗿𝗲 𝗶𝘀 𝗯𝘂𝗶𝗹𝘁 𝗯𝘆 𝘄𝗵𝗮𝘁 𝘆𝗼𝘂 𝗱𝗼 𝘁𝗼𝗱𝗮𝘆."
        ])}"`
      );
      break;

    case "emoji":
      await send(
        sock,
        remoteJid,
        `😎 𝗘𝗠𝗢𝗝𝗜 𝗖𝗛𝗔𝗟𝗟𝗘𝗡𝗚𝗘

${randomItem([
          "😂🔥💀",
          "❤️✨🥹",
          "👑🔥😎",
          "🎮🏆🔥",
          "🚀💻🤖"
        ])}`
      );
      break;

    case "mock": {
      const text = args.join(" ");

      if (!text) {
        await send(
          sock,
          remoteJid,
          "❌ 𝗨𝘀𝗮𝗴𝗲: .mock hello world"
        );
        break;
      }

      const result = [...text]
        .map((char, index) =>
          index % 2
            ? char.toLowerCase()
            : char.toUpperCase()
        )
        .join("");

      await send(
        sock,
        remoteJid,
        `😂 𝗠𝗢𝗖𝗞

${result}`
      );
      break;
    }

    case "reverse": {
      const text = args.join(" ");

      if (!text) {
        await send(
          sock,
          remoteJid,
          "❌ 𝗨𝘀𝗮𝗴𝗲: .reverse hello"
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

    case "choose": {
      if (args.length < 2) {
        await send(
          sock,
          remoteJid,
          "❌ 𝗨𝘀𝗲: .choose pizza burger"
        );
        break;
      }

      await send(
        sock,
        remoteJid,
        `🎯 𝗖𝗛𝗢𝗜𝗖𝗘

𝗤ᴜᴇᴇɴ X 𝗖𝗛𝗢𝗦𝗘:
👉 ${randomItem(args)}`
      );
      break;
    }

    case "coin": {
      await send(
        sock,
        remoteJid,
        `🪙 𝗖𝗢𝗜𝗡 𝗙𝗟𝗜𝗣

${Math.random() < 0.5
          ? "𝗛𝗘𝗔𝗗𝗦"
          : "𝗧𝗔𝗜𝗟𝗦"}`
      );
      break;
    }

    case "dice": {
      const result =
        Math.floor(Math.random() * 6) + 1;

      await send(
        sock,
        remoteJid,
        `🎲 𝗗𝗜𝗖𝗘

𝗥𝗘𝗦𝗨𝗟𝗧: ${result}`
      );
      break;
    }

    case "nickname": {
      const names = [
        "𝗤ᴜᴇᴇɴ",
        "𝗞𝗶𝗻𝗴",
        "𝗦𝘁𝗮𝗿",
        "𝗟𝗲𝗴𝗲𝗻𝗱",
        "𝗕𝗼𝘀𝘀",
        "𝗖𝗵𝗮𝗺𝗽",
        "𝗣𝗿𝗶𝗻𝗰𝗲",
        "𝗣𝗿𝗶𝗻𝗰𝗲𝘀𝘀"
      ];

      await send(
        sock,
        remoteJid,
        `👑 𝗡𝗜𝗖𝗞𝗡𝗔𝗠𝗘

𝗬𝗼𝘂𝗿 𝗻𝗶𝗰𝗸𝗻𝗮𝗺𝗲:
${randomItem(names)}`
      );
      break;
    }

    default:
      await send(
        sock,
        remoteJid,
        `🎭 𝗙𝗨𝗡 𝗖𝗢𝗠𝗠𝗔𝗡𝗗

𝗖𝗢𝗠𝗠𝗔𝗡𝗗: .${command}

𝗔𝗥𝗚𝗦: ${
          args.join(" ") || "None"
        }

✨ 𝗙𝗨𝗡 𝗛𝗔𝗡𝗗𝗟𝗘𝗥 𝗥𝗘𝗔𝗗𝗬.`
      );
  }

  return true;
}

module.exports = {
  name: "fun",
  aliases: ["funmenu"],
  commands: FUN_COMMANDS,
  handleFunCommand,

  execute: async ({
    sock,
    remoteJid
  }) => {
    await send(
      sock,
      remoteJid,
      FUN_MENU
    );
  }
};
