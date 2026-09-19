const MODERATOR_COMMANDS = [
  "ban",
  "unban",
  "kick",
  "add",
  "promote",
  "demote",
  "mute",
  "unmute",
  "warn",
  "warnings",
  "clearwarn",
  "delete",
  "purge",
  "clear",
  "tag",
  "tagall",
  "hidetag",
  "mention",
  "admins",
  "admin",
  "setrules",
  "rules",
  "antilink",
  "antispam",
  "antiflood",
  "antibot",
  "antitag",
  "antimedia",
  "antisticker",
  "antidelete",
  "welcome",
  "goodbye",
  "setwelcome",
  "setgoodbye",
  "open",
  "close",
  "lock",
  "unlock",
  "groupinfo",
  "gcstatus",
  "gclink",
  "setsubject",
  "setdescription",
  "setpp",
  "delpp",
  "revoke",
  "invite",
  "approve",
  "requests",
  "moderator"
];

function getCommand(command) {
  return MODERATOR_COMMANDS.includes(command)
    ? command
    : null;
}

async function send(sock, jid, text) {
  return sock.sendMessage(jid, { text });
}

async function getGroupMetadata(sock, jid) {
  try {
    return await sock.groupMetadata(jid);
  } catch {
    return null;
  }
}

async function isGroupAdmin(sock, jid, message) {
  const metadata = await getGroupMetadata(sock, jid);

  if (!metadata) {
    return false;
  }

  const sender =
    message?.key?.participant ||
    message?.participant ||
    "";

  const participant = metadata.participants?.find(
    p => p.id === sender
  );

  return Boolean(
    participant?.admin === "admin" ||
    participant?.admin === "superadmin"
  );
}

async function isBotAdmin(sock, jid) {
  const metadata = await getGroupMetadata(sock, jid);

  if (!metadata) {
    return false;
  }

  const botJid =
    sock.user?.id?.split(":")[0] +
    "@s.whatsapp.net";

  const participant = metadata.participants?.find(
    p =>
      p.id === botJid ||
      p.id?.split(":")[0] ===
        sock.user?.id?.split(":")[0]
  );

  return Boolean(
    participant?.admin === "admin" ||
    participant?.admin === "superadmin"
  );
}

async function handleModeratorCommand({
  sock,
  message,
  remoteJid,
  command,
  args = []
}) {
  const matchedCommand = getCommand(command);

  if (!matchedCommand) {
    return false;
  }

  if (!remoteJid.endsWith("@g.us")) {
    await send(
      sock,
      remoteJid,
      "❌ 𝗧𝗛𝗜𝗦 𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗖𝗔𝗡 𝗢𝗡𝗟𝗬 𝗕𝗘 𝗨𝗦𝗘𝗗 𝗜𝗡 𝗚𝗥𝗢𝗨𝗣𝗦."
    );

    return true;
  }

  const admin = await isGroupAdmin(
    sock,
    remoteJid,
    message
  );

  if (!admin) {
    await send(
      sock,
      remoteJid,
      "❌ 𝗢𝗡𝗟𝗬 𝗚𝗥𝗢𝗨𝗣 𝗔𝗗𝗠𝗜𝗡𝗦 𝗖𝗔𝗡 𝗨𝗦𝗘 𝗠𝗢𝗗𝗘𝗥𝗔𝗧𝗢𝗥 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗦."
    );

    return true;
  }

  if (command !== "rules" &&
      command !== "admins" &&
      command !== "groupinfo" &&
      command !== "gcstatus" &&
      command !== "gclink" &&
      command !== "moderator") {

    const botAdmin = await isBotAdmin(
      sock,
      remoteJid
    );

    if (!botAdmin) {
      await send(
        sock,
        remoteJid,
        "❌ 𝗜 𝗡𝗘𝗘𝗗 𝗧𝗢 𝗕𝗘 𝗔𝗡 𝗔𝗗𝗠𝗜𝗡 𝗙𝗜𝗥𝗦𝗧."
      );

      return true;
    }
  }

  switch (command) {

    case "moderator":
      await send(
        sock,
        remoteJid,
        "👑 𝗠𝗢𝗗𝗘𝗥𝗔𝗧𝗢𝗥 𝗠𝗘𝗡𝗨\n\n" +
        MODERATOR_MENU
      );
      break;

    case "admins": {
      const metadata =
        await getGroupMetadata(
          sock,
          remoteJid
        );

      const admins =
        metadata.participants
          .filter(p =>
            p.admin === "admin" ||
            p.admin === "superadmin"
          )
          .map(p => `@${p.id.split("@")[0]}`);

      await sock.sendMessage(remoteJid, {
        text:
          `👑 𝗚𝗥𝗢𝗨𝗣 𝗔𝗗𝗠𝗜𝗡𝗦\n\n` +
          admins.join("\n"),
        mentions:
          metadata.participants
            .filter(p =>
              p.admin === "admin" ||
              p.admin === "superadmin"
            )
            .map(p => p.id)
      });

      break;
    }

    case "groupinfo": {
      const metadata =
        await getGroupMetadata(
          sock,
          remoteJid
        );

      await send(
        sock,
        remoteJid,
        `📊 𝗚𝗥𝗢𝗨𝗣 𝗜𝗡𝗙𝗢

𝗡𝗮𝗺𝗲: ${metadata.subject}
𝗜𝗗: ${metadata.id}
𝗠𝗲𝗺𝗯𝗲𝗿𝘀: ${metadata.participants.length}
𝗖𝗿𝗲𝗮𝘁𝗼𝗿: ${metadata.owner || "Unknown"}`
      );

      break;
    }

    case "gcstatus": {
      const metadata =
        await getGroupMetadata(
          sock,
          remoteJid
        );

      const admins =
        metadata.participants.filter(
          p =>
            p.admin === "admin" ||
            p.admin === "superadmin"
        ).length;

      await send(
        sock,
        remoteJid,
        `𝗤ᴜᴇᴇɴ X — 𝗚𝗖 𝗦𝗧𝗔𝗧𝗨𝗦

𝗚𝗿𝗼𝘂𝗽: ${metadata.subject}
𝗜𝗗: ${metadata.id}
𝗠𝗲𝗺𝗯𝗲𝗿𝘀: ${metadata.participants.length}
𝗔𝗱𝗺𝗶𝗻𝘀: ${admins}
𝗠𝗼𝗱𝗲: ${metadata.announce ? "Closed" : "Open"}`
      );

      break;
    }

    case "open":
      await sock.groupSettingUpdate(
        remoteJid,
        "not_announcement"
      );

      await send(
        sock,
        remoteJid,
        "✅ 𝗚𝗥𝗢𝗨𝗣 𝗢𝗣𝗘𝗡𝗘𝗗."
      );
      break;

    case "close":
      await sock.groupSettingUpdate(
        remoteJid,
        "announcement"
      );

      await send(
        sock,
        remoteJid,
        "🔒 𝗚𝗥𝗢𝗨𝗣 𝗖𝗟𝗢𝗦𝗘𝗗."
      );
      break;

    case "promote":
    case "demote":
    case "add":
    case "kick":
    case "ban":
    case "unban":
      await send(
        sock,
        remoteJid,
        `⚙️ 𝗠𝗢𝗗𝗘𝗥𝗔𝗧𝗢𝗥

𝗖𝗢𝗠𝗠𝗔𝗡𝗗: .${command}
𝗔𝗥𝗚𝗨𝗠𝗘𝗡𝗧: ${args.join(" ") || "None"}

𝗨𝗦𝗘𝗥 𝗧𝗔𝗥𝗚𝗘𝗧 𝗛𝗔𝗡𝗗𝗟𝗜𝗡𝗚 𝗪𝗜𝗟𝗟 𝗕𝗘 𝗔𝗗𝗗𝗘𝗗 𝗧𝗢 𝗧𝗛𝗜𝗦 𝗖𝗢𝗠𝗠𝗔𝗡𝗗.`
      );
      break;

    default:
      await send(
        sock,
        remoteJid,
        `✅ 𝗠𝗢𝗗𝗘𝗥𝗔𝗧𝗢𝗥 𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗥𝗘𝗖𝗘𝗜𝗩𝗘𝗗

𝗖𝗢𝗠𝗠𝗔𝗡𝗗: .${command}
𝗔𝗥𝗚𝗦: ${args.join(" ") || "None"}`
      );
  }

  return true;
}

const MODERATOR_MENU = `
🌍⃝⃘‌‌‌━⋆─⋆──❂
┊ ┊ ┊ ┊ ┊
┊ ┊ ✫ ˚㋛ ⋆｡ ❀
┊ ☠︎︎
✧  x moderator 𓂃✍︎𝄞
╰────────────────❂

┏━━━━━━━━━━━━━━━━━━━━━━❥❥❥
┃ 𝗤ᴜᴇᴇɴ X — 𝗠𝗢𝗗𝗘𝗥𝗔𝗧𝗢𝗥
┗━━━━━━━━━━━━━━━━━━━━━━❥❥❥

┃ 𝟬𝟭. .ban
┃ 𝟬𝟮. .unban
┃ 𝟬𝟯. .kick
┃ 𝟬𝟰. .add
┃ 𝟬𝟱. .promote
┃ 𝟬𝟲. .demote
┃ 𝟬𝟳. .mute
┃ 𝟬𝟴. .unmute
┃ 𝟬𝟵. .warn
┃ 𝟭𝟬. .warnings
┃ 𝟭𝟭. .clearwarn
┃ 𝟭𝟮. .delete
┃ 𝟭𝟯. .purge
┃ 𝟭𝟰. .clear
┃ 𝟭𝟱. .tag
┃ 𝟭𝟲. .tagall
┃ 𝟭𝟳. .hidetag
┃ 𝟭𝟴. .mention
┃ 𝟭𝟵. .admins
┃ 𝟮𝟬. .admin
┃ 𝟮𝟭. .setrules
┃ 𝟮𝟮. .rules
┃ 𝟮𝟯. .antilink
┃ 𝟮𝟰. .antispam
┃ 𝟮𝟱. .antiflood
┃ 𝟮𝟲. .antibot
┃ 𝟮𝟳. .antitag
┃ 𝟮𝟴. .antimedia
┃ 𝟮𝟵. .antisticker
┃ 𝟯𝟬. .antidelete
┃ 𝟯𝟭. .welcome
┃ 𝟯𝟮. .goodbye
┃ 𝟯𝟯. .setwelcome
┃ 𝟯𝟰. .setgoodbye
┃ 𝟯𝟱. .open
┃ 𝟯𝟲. .close
┃ 𝟯𝟳. .lock
┃ 𝟯𝟴. .unlock
┃ 𝟯𝟵. .groupinfo
┃ 𝟰𝟬. .gcstatus
┃ 𝟰𝟭. .gclink
┃ 𝟰𝟮. .setsubject
┃ 𝟰𝟯. .setdescription
┃ 𝟰𝟰. .setpp
┃ 𝟰𝟱. .delpp
┃ 𝟰𝟲. .revoke
┃ 𝟰𝟳. .invite
┃ 𝟰𝟴. .approve
┃ 𝟰𝟵. .requests
┃ 𝟱𝟬. .moderator
┗━━━━━━━━━━━━━━━━━━━━━━❥❥❥

𝗧𝗢𝗧𝗔𝗟: 𝟱𝟬 𝗠𝗢𝗗𝗘𝗥𝗔𝗧𝗢𝗥 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗦
`;

module.exports = {
  name: "moderator",
  aliases: ["mod", "modmenu"],
  commands: MODERATOR_COMMANDS,
  handleModeratorCommand,
  execute: async ({ sock, remoteJid }) => {
    await sock.sendMessage(remoteJid, {
      text: MODERATOR_MENU
    });
  }
};
