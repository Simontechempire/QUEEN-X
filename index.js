require("dotenv").config();

// ═══════════════════════════════════════
// 🌐 START QUEEN X WEB SERVER
// ═══════════════════════════════════════

require("./server");

// ═══════════════════════════════════════
// 📱 WHATSAPP
// ═══════════════════════════════════════

const {
  startWhatsApp
} = require("./lib/connect");

console.log(`
╔══════════════════════════════════════╗
║          Qᴜᴇᴇɴ X 𝗕𝗢𝗧              ║
╠══════════════════════════════════════╣
║       𝗦𝗧𝗔𝗥𝗧𝗜𝗡𝗚 𝗤ᴜᴇᴇɴ X...        ║
╚══════════════════════════════════════╝
`);

async function startBot() {
  try {
    if (typeof startWhatsApp !== "function") {
      throw new Error(
        "startWhatsApp() was not found in lib/connect.js"
      );
    }

    await startWhatsApp();

    console.log(
      "✅ 𝗪𝗛𝗔𝗧𝗦𝗔𝗣𝗣 𝗕𝗢𝗧 𝗦𝗧𝗔𝗥𝗧𝗘𝗗"
    );

  } catch (error) {
    console.error(
      "❌ 𝗪𝗛𝗔𝗧𝗦𝗔𝗣𝗣 𝗦𝗧𝗔𝗥𝗧 𝗙𝗔𝗜𝗟𝗘𝗗:",
      error
    );

    // Do NOT kill the Express server.
    // Render still needs the web server running.
  }
}

startBot();

process.on(
  "uncaughtException",
  error => {
    console.error(
      "❌ 𝗨𝗡𝗖𝗔𝗨𝗚𝗛𝗧 𝗘𝗫𝗖𝗘𝗣𝗧𝗜𝗢𝗡:",
      error
    );
  }
);

process.on(
  "unhandledRejection",
  error => {
    console.error(
      "❌ 𝗨𝗡𝗛𝗔𝗡𝗗𝗟𝗘𝗗 𝗥𝗘𝗝𝗘𝗖𝗧𝗜𝗢𝗡:",
      error
    );
  }
);
