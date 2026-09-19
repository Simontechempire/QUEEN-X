const AI_COMMANDS = [
  "ai",
  "ask",
  "chat",
  "gpt",
  "gemini",
  "llama",
  "deepseek",
  "claude",
  "copilot",
  "explain",
  "summarize",
  "translate",
  "rewrite",
  "grammar",
  "correct",
  "code",
  "debug",
  "fixcode",
  "reviewcode",
  "generatecode",
  "html",
  "css",
  "javascript",
  "python",
  "nodejs",
  "json",
  "regex",
  "sql",
  "idea",
  "brainstorm",
  "story",
  "poem",
  "lyrics",
  "quote",
  "caption",
  "email",
  "essay",
  "article",
  "question",
  "answer",
  "math",
  "solve",
  "define",
  "meaning",
  "improve",
  "humanize",
  "shorten",
  "expand",
  "imagine",
  "aichat"
];

const AI_MENU = `
🌍⃝⃘‌‌‌━⋆─⋆──❂
┊ ┊ ┊ ┊ ┊
┊ ┊ ✫ ˚㋛ ⋆｡ ❀
┊ ☠︎︎
✧  x ai 𓂃✍︎𝄞
╰────────────────❂

┏━━━━━━━━━━━━━━━━━━━━━━❥❥❥
┃ 𝗤ᴜᴇᴇɴ X — 𝗔𝗜
┗━━━━━━━━━━━━━━━━━━━━━━❥❥❥

${AI_COMMANDS
  .map(
    (cmd, index) =>
      `┃ ${String(index + 1).padStart(2, "0")}. .${cmd}`
  )
  .join("\n")}

┗━━━━━━━━━━━━━━━━━━━━━━❥❥❥

𝗧𝗢𝗧𝗔𝗟: 𝟱𝟬 𝗔𝗜 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗦
`;

async function send(sock, jid, text) {
  return sock.sendMessage(jid, { text });
}

async function handleAICommand({
  sock,
  remoteJid,
  command,
  args = []
}) {
  if (!AI_COMMANDS.includes(command)) {
    return false;
  }

  if (
    command === "ai" ||
    command === "ask" ||
    command === "chat" ||
    command === "aichat"
  ) {
    const prompt = args.join(" ").trim();

    if (!prompt) {
      await send(
        sock,
        remoteJid,
        `🤖 𝗤ᴜᴇᴇɴ X 𝗔𝗜

𝗨𝘀𝗮𝗴𝗲:
.ai your question

𝗘𝘅𝗮𝗺𝗽𝗹𝗲:
.ai explain JavaScript`
      );

      return true;
    }

    await send(
      sock,
      remoteJid,
      `🤖 𝗔𝗜 𝗥𝗘𝗤𝗨𝗘𝗦𝗧 𝗥𝗘𝗖𝗘𝗜𝗩𝗘𝗗

𝗤𝘂𝗲𝘀𝘁𝗶𝗼𝗻:
${prompt}

⏳ 𝗔𝗜 𝗣𝗥𝗢𝗖𝗘𝗦𝗦𝗜𝗡𝗚 𝗪𝗜𝗟𝗟 𝗕𝗘 𝗖𝗢𝗡𝗡𝗘𝗖𝗧𝗘𝗗 𝗛𝗘𝗥𝗘.`
    );

    return true;
  }

  if (command === "aichat") {
    await send(sock, remoteJid, AI_MENU);
    return true;
  }

  await send(
    sock,
    remoteJid,
    `🤖 𝗔𝗜 𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗥𝗘𝗖𝗘𝗜𝗩𝗘𝗗

𝗖𝗢𝗠𝗠𝗔𝗡𝗗: .${command}

𝗥𝗘𝗤𝗨𝗘𝗦𝗧:
${args.join(" ") || "None"}

⚙️ 𝗧𝗛𝗘 𝗔𝗜 𝗣𝗥𝗢𝗩𝗜𝗗𝗘𝗥 𝗪𝗜𝗟𝗟 𝗕𝗘 𝗖𝗢𝗡𝗡𝗘𝗖𝗧𝗘𝗗 𝗧𝗢 𝗧𝗛𝗜𝗦 𝗛𝗔𝗡𝗗𝗟𝗘𝗥.`
  );

  return true;
}

module.exports = {
  name: "ai",
  aliases: ["aimenu"],
  commands: AI_COMMANDS,
  handleAICommand,
  execute: async ({ sock, remoteJid }) => {
    await send(sock, remoteJid, AI_MENU);
  }
};
