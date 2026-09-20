const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const path = require("path");

let sock = null;
let reconnecting = false;

// ═══════════════════════════════════════
// START WHATSAPP
// ═══════════════════════════════════════

async function startWhatsApp() {
  if (sock) {
    return sock;
  }

  const authDir = path.join(
    process.cwd(),
    "auth"
  );

  const {
    state,
    saveCreds
  } = await useMultiFileAuthState(authDir);

  sock = makeWASocket({
    auth: state,

    logger: pino({
      level: "silent"
    }),

    browser: [
      "Qᴜᴇᴇɴ X",
      "Chrome",
      "1.0.0"
    ],

    printQRInTerminal: false,

    markOnlineOnConnect: false
  });

  // ═════════════════════════════════════
  // SAVE SESSION
  // ═════════════════════════════════════

  sock.ev.on(
    "creds.update",
    saveCreds
  );

  // ═════════════════════════════════════
  // CONNECTION
  // ═════════════════════════════════════

  sock.ev.on(
    "connection.update",
    ({
      connection,
      lastDisconnect
    }) => {

      if (connection === "open") {
        reconnecting = false;

        console.log(`
╔══════════════════════════════════════╗
║       Qᴜᴇᴇɴ X WHATSAPP              ║
╠══════════════════════════════════════╣
║       🟢 CONNECTED                   ║
╚══════════════════════════════════════╝
        `);
      }

      if (connection === "close") {

        const statusCode =
          lastDisconnect
            ?.error
            ?.output
            ?.statusCode;

        console.log(
          "❌ WhatsApp connection closed:",
          statusCode || "unknown"
        );

        sock = null;

        // 405 is being rejected.
        // Don't reconnect endlessly.
        if (
          statusCode === 405
        ) {
          console.log(`
⚠️ Qᴜᴇᴇɴ X WhatsApp connection
was rejected with status 405.

Check the WhatsApp session/auth
and Baileys version before retrying.
          `);

          return;
        }

        if (
          statusCode ===
          DisconnectReason.loggedOut
        ) {
          console.log(
            "⚠️ WhatsApp session logged out."
          );

          return;
        }

        if (!reconnecting) {
          reconnecting = true;

          console.log(
            "🔄 Reconnecting WhatsApp in 5 seconds..."
          );

          setTimeout(
            async () => {
              reconnecting = false;

              try {
                await startWhatsApp();
              } catch (error) {
                console.error(
                  "❌ Reconnection failed:",
                  error
                );
              }
            },
            5000
          );
        }
      }
    }
  );

  return sock;
}

// ═══════════════════════════════════════
// GET SOCKET
// ═══════════════════════════════════════

function getSocket() {
  return sock;
}

// ═══════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════

module.exports = {
  startWhatsApp,
  getSocket
};
