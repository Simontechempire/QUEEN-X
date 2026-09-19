const SEARCH_COMMANDS = [
  "search",
  "google",
  "web",
  "news",
  "images",
  "image",
  "youtube",
  "ytsearch",
  "tiktoksearch",
  "instagramsearch",
  "facebooksearch",
  "twittersearch",
  "xsearch",
  "githubsearch",
  "npmsearch",
  "wikisearch",
  "wiki",
  "reddit",
  "redditsearch",
  "weather",
  "map",
  "maps",
  "define",
  "meaning",
  "dictionary",
  "translate",
  "lyrics",
  "movie",
  "movies",
  "anime",
  "songsearch",
  "artist",
  "book",
  "recipe",
  "sports",
  "football",
  "cricket",
  "technology",
  "finance",
  "crypto",
  "stocks",
  "currency",
  "country",
  "iplookup",
  "domain",
  "whois",
  "dnslookup",
  "urlinfo",
  "find",
  "searchhelp"
];

const SEARCH_MENU = `
🌍⃝⃘‌‌‌━⋆─⋆──❂
┊ ┊ ┊ ┊ ┊
┊ ┊ ✫ ˚㋛ ⋆｡ ❀
┊ ☠︎︎
✧  x search 𓂃✍︎𝄞
╰────────────────❂

┏━━━━━━━━━━━━━━━━━━━━━━❥❥❥
┃ 𝗤ᴜᴇᴇɴ X — 𝗦𝗘𝗔𝗥𝗖𝗛
┗━━━━━━━━━━━━━━━━━━━━━━❥❥❥

${SEARCH_COMMANDS.map(
  (cmd, i) =>
    `┃ ${String(i + 1).padStart(2, "0")}. .${cmd}`
).join("\n")}

┗━━━━━━━━━━━━━━━━━━━━━━❥❥❥

𝗧𝗢𝗧𝗔𝗟: 𝟱𝟬 𝗦𝗘𝗔𝗥𝗖𝗛 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗦
`;

async function send(sock, jid, text) {
  return sock.sendMessage(jid, { text });
}

async function handleSearchCommand({
  sock,
  remoteJid,
  command,
  args = []
}) {
  if (!SEARCH_COMMANDS.includes(command)) {
    return false;
  }

  if (
    command === "search" ||
    command === "searchhelp"
  ) {
    await send(sock, remoteJid, SEARCH_MENU);
    return true;
  }

  const query = args.join(" ").trim();

  if (!query) {
    await send(
      sock,
      remoteJid,
      `❌ 𝗦𝗘𝗔𝗥𝗖𝗛 𝗤𝗨𝗘𝗥𝗬 𝗥𝗘𝗤𝗨𝗜𝗥𝗘𝗗

𝗨𝘀𝗮𝗴𝗲:
.${command} your search

𝗘𝘅𝗮𝗺𝗽𝗹𝗲:
.google Queen X WhatsApp bot`
    );

    return true;
  }

  await send(
    sock,
    remoteJid,
    `🔎 𝗦𝗘𝗔𝗥𝗖𝗛 𝗥𝗘𝗤𝗨𝗘𝗦𝗧

𝗧𝗬𝗣𝗘:
.${command}

𝗤𝗨𝗘𝗥𝗬:
${query}

⏳ 𝗦𝗘𝗔𝗥𝗖𝗛 𝗣𝗥𝗢𝗩𝗜𝗗𝗘𝗥 𝗪𝗜𝗟𝗟 𝗕𝗘 𝗖𝗢𝗡𝗡𝗘𝗖𝗧𝗘𝗗 𝗛𝗘𝗥𝗘.`
  );

  return true;
}

module.exports = {
  name: "search",
  aliases: ["searchmenu"],
  commands: SEARCH_COMMANDS,
  handleSearchCommand,

  execute: async ({
    sock,
    remoteJid
  }) => {
    await send(
      sock,
      remoteJid,
      SEARCH_MENU
    );
  }
};
