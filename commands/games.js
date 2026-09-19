const GAMES = [
  "games",
  "dice",
  "coin",
  "flip",
  "roll",
  "rps",
  "rockpaper",
  "guess",
  "guessnumber",
  "quiz",
  "trivia",
  "mathquiz",
  "wordquiz",
  "emojiquiz",
  "flagquiz",
  "anagram",
  "scramble",
  "hangman",
  "slots",
  "blackjack",
  "8ball",
  "truth",
  "dare",
  "wouldyourather",
  "neverhavei",
  "wyr",
  "ship",
  "love",
  "couple",
  "tictactoe",
  "connect4",
  "chess",
  "checkers",
  "memory",
  "reaction",
  "fasttype",
  "typing",
  "riddle",
  "puzzle",
  "challenge",
  "battle",
  "duel",
  "fight",
  "adventure",
  "treasure",
  "hunt",
  "race",
  "football",
  "basketball",
  "game"
];

const GAME_MENU = `
🌍⃝⃘‌‌‌━⋆─⋆──❂
┊ ┊ ┊ ┊ ┊
┊ ┊ ✫ ˚㋛ ⋆｡ ❀
┊ ☠︎︎
✧  x games 𓂃✍︎𝄞
╰────────────────❂

┏━━━━━━━━━━━━━━━━━━━━━━❥❥❥
┃ 𝗤ᴜᴇᴇɴ X — 𝗚𝗔𝗠𝗘𝗦
┗━━━━━━━━━━━━━━━━━━━━━━❥❥❥

${GAMES.map(
  (cmd, i) =>
    `┃ ${String(i + 1).padStart(2, "0")}. .${cmd}`
).join("\n")}

┗━━━━━━━━━━━━━━━━━━━━━━❥❥❥

𝗧𝗢𝗧𝗔𝗟: 𝟱𝟬 𝗚𝗔𝗠𝗘 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗦
`;

async function send(sock, jid, text) {
  return sock.sendMessage(jid, { text });
}

function random(min, max) {
  return Math.floor(
    Math.random() * (max - min + 1)
  ) + min;
}

async function handleGamesCommand({
  sock,
  remoteJid,
  command,
  args = []
}) {
  if (!GAMES.includes(command)) {
    return false;
  }

  switch (command) {

    case "games":
    case "game":
      await send(sock, remoteJid, GAME_MENU);
      break;

    case "dice":
    case "roll": {
      const result = random(1, 6);

      await send(
        sock,
        remoteJid,
        `🎲 𝗗𝗜𝗖𝗘 𝗥𝗢𝗟𝗟

𝗥𝗘𝗦𝗨𝗟𝗧: ${result}`
      );

      break;
    }

    case "coin":
    case "flip": {
      const result =
        Math.random() < 0.5
          ? "𝗛𝗘𝗔𝗗𝗦"
          : "𝗧𝗔𝗜𝗟𝗦";

      await send(
        sock,
        remoteJid,
        `🪙 𝗖𝗢𝗜𝗡 𝗙𝗟𝗜𝗣

𝗥𝗘𝗦𝗨𝗟𝗧: ${result}`
      );

      break;
    }

    case "8ball": {
      const answers = [
        "𝗬𝗘𝗦.",
        "𝗡𝗢.",
        "𝗠𝗔𝗬𝗕𝗘.",
        "𝗔𝗦𝗞 𝗔𝗚𝗔𝗜𝗡.",
        "𝗗𝗘𝗙𝗜𝗡𝗜𝗧𝗘𝗟𝗬.",
        "𝗡𝗢𝗧 𝗟𝗜𝗞𝗘𝗟𝗬."
      ];

      await send(
        sock,
        remoteJid,
        `🎱 𝗠𝗔𝗚𝗜𝗖 𝟴 𝗕𝗔𝗟𝗟

${answers[random(0, answers.length - 1)]}`
      );

      break;
    }

    case "rps":
    case "rockpaper": {
      const choices = [
        "🪨 𝗥𝗢𝗖𝗞",
        "📄 𝗣𝗔𝗣𝗘𝗥",
        "✂️ 𝗦𝗖𝗜𝗦𝗦𝗢𝗥𝗦"
      ];

      await send(
        sock,
        remoteJid,
        `🎮 𝗥𝗢𝗖𝗞 𝗣𝗔𝗣𝗘𝗥 𝗦𝗖𝗜𝗦𝗦𝗢𝗥𝗦

🤖 𝗤ᴜᴇᴇɴ X:
${choices[random(0, 2)]}

𝗨𝗦𝗘:
.rps rock
.rps paper
.rps scissors`
      );

      break;
    }

    case "guess":
    case "guessnumber":
      await send(
        sock,
        remoteJid,
        `🎯 𝗚𝗨𝗘𝗦𝗦𝗜𝗡𝗚 𝗚𝗔𝗠𝗘

𝗚𝘂𝗲𝘀𝘀 𝗮 𝗻𝘂𝗺𝗯𝗲𝗿 𝗳𝗿𝗼𝗺 𝟭 𝘁𝗼 𝟭𝟬𝟬.

𝗘𝘅𝗮𝗺𝗽𝗹𝗲:
.guess 50`
      );
      break;

    case "quiz":
    case "trivia":
      await send(
        sock,
        remoteJid,
        `🧠 𝗤ᴜ𝗜𝗭

𝗤ᴜᴇ𝘀𝘁𝗶𝗼𝗻:
𝗪𝗵𝗮𝘁 𝗶𝘀 𝟮 + 𝟮?

𝗔. 𝟯
𝗕. 𝟰
𝗖. 𝟱
𝗗. 𝟲

𝗨𝘀𝗲:
.quiz B`
      );
      break;

    case "riddle":
      await send(
        sock,
        remoteJid,
        `🧩 𝗥𝗜𝗗𝗗𝗟𝗘

𝗪𝗵𝗮𝘁 𝗵𝗮𝘀 𝗸𝗲𝘆𝘀 𝗯𝘂𝘁 𝗰𝗮𝗻𝗻𝗼𝘁 𝗼𝗽𝗲𝗻 𝗮 𝗹𝗼𝗰𝗸?

𝗥𝗲𝗽𝗹𝘆:
.riddle answer`
      );
      break;

    case "truth":
    case "dare":
    case "wouldyourather":
    case "neverhavei":
    case "wyr":
      await send(
        sock,
        remoteJid,
        `🎮 𝗚𝗔𝗠𝗘: .${command}

𝗣𝗹𝗮𝘆 𝘄𝗶𝘁𝗵 𝘆𝗼𝘂𝗿 𝗳𝗿𝗶𝗲𝗻𝗱𝘀!`
      );
      break;

    default:
      await send(
        sock,
        remoteJid,
        `🎮 𝗚𝗔𝗠𝗘 𝗖𝗢𝗠𝗠𝗔𝗡𝗗

𝗖𝗢𝗠𝗠𝗔𝗡𝗗: .${command}

𝗔𝗥𝗚𝗦: ${args.join(" ") || "None"}

⚙️ 𝗚𝗔𝗠𝗘 𝗛𝗔𝗡𝗗𝗟𝗘𝗥 𝗥𝗘𝗔𝗗𝗬.`
      );
  }

  return true;
}

module.exports = {
  name: "games",
  aliases: ["game"],
  commands: GAMES,
  handleGamesCommand,
  execute: async ({ sock, remoteJid }) => {
    await send(sock, remoteJid, GAME_MENU);
  }
};
