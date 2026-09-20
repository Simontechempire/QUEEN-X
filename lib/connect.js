const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const {
  ensureAuthDirectory,
  getAuthPath
} = require("./session");

let sock = null;
let reconnectTimer = null;

// ═══════════════════════════════════════
// 👑 QUEEN X — WHATSAPP CONNECTION
// ═══════════════════════════════════════

async function startWhatsApp(sessionId = "main") {
  try {

    // Make sure sessions/ exists
    ensureAuthDirectory();

    // Use sessions/main/
    const sessionPath =
      getAuthPath(sessionId);

    console.log(
      `📁 WhatsApp session: ${sessionPath}`
    );

    const {
      state,
      saveCreds
    } = await useMultiFileAuthState(
      sessionPath
    );

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

      markOnlineOnConnect: false,

      syncFullHistory: false
    });

    // ═══════════════════════════════
    // 💾 SAVE CREDENTIALS
    // ═══════════════════════════════

    sock.ev.on(
      "creds.update",
      saveCreds
    );

    // ═══════════════════════════════
    // 📡 CONNECTION UPDATE
    // ═══════════════════════════════

    sock.ev.on(
      "connection.update",
      ({
        connection,
        lastDisconnect
      }) => {

        if (connection === "connecting") {
          console.log(
            "🔄 Connecting to WhatsApp..."
          );
        }

        if (connection === "open") {

          console.log(`
╔══════════════════════════════════════╗
║          Qᴜᴇᴇɴ X WHATSAPP          ║
╠══════════════════════════════════════╣
║          🟢 CONNECTED               ║
║          SESSION: ${sessionId}       ║
╚══════════════════════════════════════╝
          `);

          return;
        }

        if (connection === "close") {

          const error =
            lastDisconnect?.error;

          const statusCode =
            error?.output?.statusCode;

          console.log(
            "❌ WhatsApp connection closed:",
            statusCode || "unknown"
          );

          sock = null;

          // ═══════════════════════════
          // 🚫 405
          // ═══════════════════════════

          if (statusCode === 405) {

            console.log(`
⚠️ Qᴜᴇᴇɴ X received WhatsApp
status 405.

The current session or the
installed Baileys version may
need attention.

Automatic reconnect stopped.
            `);

            return;
          }

          // ═══════════════════════════
          // 🚪 LOGGED OUT
          // ═══════════════════════════

          if (
            statusCode ===
            DisconnectReason.loggedOut
          ) {

            console.log(
              "🚪 WhatsApp session logged out."
            );

            return;
          }

          // ═══════════════════════════
          // 🔄 OTHER CONNECTION ERRORS
          // ═══════════════════════════

          if (!reconnectTimer) {

            console.log(
              "🔄 Reconnecting WhatsApp in 5 seconds..."
            );

            reconnectTimer =
              setTimeout(
                async () => {

                  reconnectTimer = null;

                  try {

                    await startWhatsApp(
                      sessionId
                    );

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

  } catch (error) {

    sock = null;

    console.error(
      "❌ WhatsApp connection error:",
      error
    );

    throw error;
  }
}

// ═══════════════════════════════════════
// 📡 GET SOCKET
// ═══════════════════════════════════════

function getSocket() {
  return sock;
}

// ═══════════════════════════════════════
// 📤 EXPORT
// ═══════════════════════════════════════

module.exports = {
  startWhatsApp,
  getSocket
};
