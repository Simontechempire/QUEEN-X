const GROUP_COMMANDS = [
  "groupinfo",
  "gcstatus",
  "gclink",
  "invite",
  "revoke",
  "add",
  "remove",
  "kick",
  "promote",
  "demote",
  "admins",
  "tagall",
  "hidetag",
  "tag",
  "mention",
  "setsubject",
  "setdescription",
  "setpp",
  "delpp",
  "open",
  "close",
  "lock",
  "unlock",
  "announce",
  "unannounce",
  "welcome",
  "goodbye",
  "setwelcome",
  "setgoodbye",
  "antilink",
  "antispam",
  "antiflood",
  "antibot",
  "antitag",
  "antimedia",
  "antisticker",
  "antidelete",
  "setrules",
  "rules",
  "setname",
  "setdesc",
  "requests",
  "approve",
  "reject",
  "pending",
  "join",
  "leave",
  "groupmode",
  "groupadmins",
  "groupmembers",
  "group"
];

async function send(sock, jid, text, options = {}) {
  return sock.sendMessage(jid, {
    text,
    ...options
  });
}

async function getMetadata(sock, jid) {
  try {
    return await sock.groupMetadata(jid);
  } catch {
    return null;
  }
}

async function requireGroup(sock, jid) {
  if (!jid?.endsWith("@g.us")) {
    await send(
      sock,
      jid,
      "❌ 𝗧𝗛𝗜𝗦 𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗪𝗢𝗥𝗞𝗦 𝗢𝗡𝗟𝗬 𝗜𝗡 𝗚𝗥𝗢𝗨𝗣𝗦."
    );

    return false;
  }

  return true;
}

async function isAdmin(sock, jid, message) {
  const metadata = await getMetadata(sock, jid);

  if (!metadata) return false;

  const sender =
    message?.key?.participant ||
    message?.participant;

  const participant =
    metadata.participants.find(
      p => p.id === sender
    );

  return Boolean(
    participant?.admin === "admin" ||
    participant?.admin === "superadmin"
  );
}

async function isBotAdmin(sock, jid) {
  const metadata = await getMetadata(sock, jid);

  if (!metadata) return false;

  const botNumber =
    sock.user?.id?.split(":")[0];

  const participant =
    metadata.participants.find(
      p =>
        p.id?.split("@")[0]?.split(":")[0] ===
        botNumber
    );

  return Boolean(
    participant?.admin === "admin" ||
    participant?.admin === "superadmin"
  );
}

function getTarget(message, args = []) {
  const mentioned =
    message?.message?.extendedTextMessage
      ?.contextInfo?.mentionedJid?.[0];

  if (mentioned) return mentioned;

  const quoted =
    message?.message?.extendedTextMessage
      ?.contextInfo?.participant;

  if (quoted) return quoted;

  if (args[0]) {
    const number = args[0].replace(/\D/g, "");

    if (number) {
      return `${number}@s.whatsapp.net`;
    }
  }

  return null;
}

async function handleGroupCommand({
  sock,
  message,
  remoteJid,
  command,
  args = []
}) {
  if (!GROUP_COMMANDS.includes(command)) {
    return false;
  }

  if (!(await requireGroup(sock, remoteJid))) {
    return true;
  }

  const metadata =
    await getMetadata(sock, remoteJid);

  if (!metadata) {
    await send(
      sock,
      remoteJid,
      "❌ 𝗨𝗡𝗔𝗕𝗟𝗘 𝗧𝗢 𝗥𝗘𝗔𝗗 𝗚𝗥𝗢𝗨𝗣 𝗜𝗡𝗙𝗢."
    );

    return true;
  }

  const adminCommands = [
    "add",
    "remove",
    "kick",
    "promote",
    "demote",
    "setsubject",
    "setdescription",
    "setpp",
    "delpp",
    "open",
    "close",
    "lock",
    "unlock",
    "announce",
    "unannounce",
    "setwelcome",
    "setgoodbye",
    "antilink",
    "antispam",
    "antiflood",
    "antibot",
    "antitag",
    "antimedia",
    "antisticker",
    "antidelete",
    "setrules",
    "revoke",
    "approve",
    "reject"
  ];

  if (adminCommands.includes(command)) {
    if (!(await isAdmin(sock, remoteJid, message))) {
      await send(
        sock,
        remoteJid,
        "❌ 𝗢𝗡𝗟𝗬 𝗚𝗥𝗢𝗨𝗣 𝗔𝗗𝗠𝗜𝗡𝗦 𝗖𝗔𝗡 𝗨𝗦𝗘 𝗧𝗛𝗜𝗦."
      );

      return true;
    }

    if (!(await isBotAdmin(sock, remoteJid))) {
      await send(
        sock,
        remoteJid,
        "❌ 𝗣𝗟𝗘𝗔𝗦𝗘 𝗠𝗔𝗞𝗘 𝗤ᴜᴇᴇɴ X 𝗔𝗡 𝗔𝗗𝗠𝗜𝗡 𝗙𝗜𝗥𝗦𝗧."
      );

      return true;
    }
  }

  switch (command) {

    case "group":
      await send(
        sock,
        remoteJid,
        `👑 𝗚𝗥𝗢𝗨𝗣 𝗠𝗘𝗡𝗨

${GROUP_COMMANDS
  .map(
    (cmd, i) =>
      `${String(i + 1).padStart(2, "0")}. .${cmd}`
  )
  .join("\n")}

𝗧𝗢𝗧𝗔𝗟: 𝟱𝟬`
      );
      break;

    case "groupinfo":
    case "gcstatus": {
      const admins =
        metadata.participants.filter(
          p =>
            p.admin === "admin" ||
            p.admin === "superadmin"
        );

      await send(
        sock,
        remoteJid,
        `𝗤ᴜᴇᴇɴ X — 𝗚𝗥𝗢𝗨𝗣 𝗦𝗧𝗔𝗧𝗨𝗦

𝗚𝗿𝗼𝘂𝗽: ${metadata.subject}
𝗜𝗗: ${metadata.id}
𝗠𝗲𝗺𝗯𝗲𝗿𝘀: ${metadata.participants.length}
𝗔𝗱𝗺𝗶𝗻𝘀: ${admins.length}
𝗠𝗼𝗱𝗲: ${
  metadata.announce
    ? "𝗔𝗗𝗠𝗜𝗡 𝗢𝗡𝗟𝗬"
    : "𝗢𝗣𝗘𝗡"
}`
      );
      break;
    }

    case "admins": {
      const admins =
        metadata.participants.filter(
          p =>
            p.admin === "admin" ||
            p.admin === "superadmin"
        );

      const mentions =
        admins.map(p => p.id);

      await send(
        sock,
        remoteJid,
        `👑 𝗚𝗥𝗢𝗨𝗣 𝗔𝗗𝗠𝗜𝗡𝗦

${mentions
  .map(id => `@${id.split("@")[0]}`)
  .join("\n")}`,
        { mentions }
      );

      break;
    }

    case "tagall":
    case "hidetag": {
      const mentions =
        metadata.participants.map(
          p => p.id
        );

      const text =
        args.join(" ") ||
        "𝗤ᴜᴇᴇɴ X 𝗧𝗔𝗚 𝗔𝗟𝗟";

      await send(
        sock,
        remoteJid,
        text,
        { mentions }
      );

      break;
    }

    case "add": {
      const target =
        getTarget(message, args);

      if (!target) {
        await send(
          sock,
          remoteJid,
          "❌ 𝗨𝗦𝗔𝗚𝗘: .add 234XXXXXXXXXX"
        );
        break;
      }

      await sock.groupParticipantsUpdate(
        remoteJid,
        [target],
        "add"
      );

      await send(
        sock,
        remoteJid,
        "✅ 𝗠𝗘𝗠𝗕𝗘𝗥 𝗔𝗗𝗗𝗘𝗗."
      );

      break;
    }

    case "remove":
    case "kick": {
      const target =
        getTarget(message, args);

      if (!target) {
        await send(
          sock,
          remoteJid,
          `❌ 𝗨𝗦𝗔𝗚𝗘: .${command} @user`
        );
        break;
      }

      await sock.groupParticipantsUpdate(
        remoteJid,
        [target],
        "remove"
      );

      await send(
        sock,
        remoteJid,
        "✅ 𝗠𝗘𝗠𝗕𝗘𝗥 𝗥𝗘𝗠𝗢𝗩𝗘𝗗."
      );

      break;
    }

    case "promote":
    case "demote": {
      const target =
        getTarget(message, args);

      if (!target) {
        await send(
          sock,
          remoteJid,
          `❌ 𝗨𝗦𝗔𝗚𝗘: .${command} @user`
        );
        break;
      }

      await sock.groupParticipantsUpdate(
        remoteJid,
        [target],
        command
      );

      await send(
        sock,
        remoteJid,
        `✅ 𝗨𝗦𝗘𝗥 ${command === "promote" ? "𝗣𝗥𝗢𝗠𝗢𝗧𝗘𝗗" : "𝗗𝗘𝗠𝗢𝗧𝗘𝗗"}.`
      );

      break;
    }

    case "open":
    case "unannounce":
      await sock.groupSettingUpdate(
        remoteJid,
        "not_announcement"
      );

      await send(
        sock,
        remoteJid,
        "🔓 𝗚𝗥𝗢𝗨𝗣 𝗜𝗦 𝗡𝗢𝗪 𝗢𝗣𝗘𝗡."
      );
      break;

    case "close":
    case "announce":
      await sock.groupSettingUpdate(
        remoteJid,
        "announcement"
      );

      await send(
        sock,
        remoteJid,
        "🔒 𝗚𝗥𝗢𝗨𝗣 𝗜𝗦 𝗡𝗢𝗪 𝗔𝗗𝗠𝗜𝗡 𝗢𝗡𝗟𝗬."
      );
      break;

    case "lock":
      await sock.groupSettingUpdate(
        remoteJid,
        "locked"
      );

      await send(
        sock,
        remoteJid,
        "🔒 𝗚𝗥𝗢𝗨𝗣 𝗜𝗡𝗙𝗢 𝗟𝗢𝗖𝗞𝗘𝗗."
      );
      break;

    case "unlock":
      await sock.groupSettingUpdate(
        remoteJid,
        "unlocked"
      );

      await send(
        sock,
        remoteJid,
        "🔓 𝗚𝗥𝗢𝗨𝗣 𝗜𝗡𝗙𝗢 𝗨𝗡𝗟𝗢𝗖𝗞𝗘𝗗."
      );
      break;

    case "revoke": {
      const code =
        await sock.groupRevokeInvite(
          remoteJid
        );

      await send(
        sock,
        remoteJid,
        `✅ 𝗚𝗥𝗢𝗨𝗣 𝗟𝗜𝗡𝗞 𝗥𝗘𝗩𝗢𝗞𝗘𝗗.

𝗡𝗘𝗪 𝗟𝗜𝗡𝗞:
https://chat.whatsapp.com/${code}`
      );

      break;
    }

    case "gclink": {
      const code =
        await sock.groupInviteCode(
          remoteJid
        );

      await send(
        sock,
        remoteJid,
        `🔗 𝗚𝗥𝗢𝗨𝗣 𝗟𝗜𝗡𝗞

https://chat.whatsapp.com/${code}`
      );

      break;
    }

    default:
      await send(
        sock,
        remoteJid,
        `✅ 𝗚𝗥𝗢𝗨𝗣 𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗥𝗘𝗖𝗘𝗜𝗩𝗘𝗗

𝗖𝗢𝗠𝗠𝗔𝗡𝗗: .${command}
𝗔𝗥𝗚𝗦: ${args.join(" ") || "None"}`
      );
  }

  return true;
}

module.exports = {
  name: "group",
  aliases: ["groupmenu"],
  commands: GROUP_COMMANDS,
  handleGroupCommand
};
