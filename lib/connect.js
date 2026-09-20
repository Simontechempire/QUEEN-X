const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const path = require("path");

let sock = null;

// ═══════════════════════════════════════
// START WHATSAPP
// ═══════════════════════════════════════

async function startWhatsApp() {
  try {
    const authDir = path.join(
      process.cwd(),
      "auth"
    );

    const {
      state,
      saveCreds
    } = await useMultiFileAuthState(
      authDir
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

      printQRInTerminal: false
    });

    // Save authentication credentials
    sock.ev.on(
      "creds.update",
      saveCreds
    );

    // Connection events
    sock.ev.on(
      "connection.update",
      ({
        connection,
        lastDisconnect
      }) => {

        if (connection === "open") {
          console.log(
            "╔════════════════════════════════════╗"
          );

          console.log(
            "║       Qᴜᴇᴇɴ X WHATSAPP            ║"
          );

          console.log(
            "║       🟢 CONNECTED                 ║"
          );

          console.log(
            "╚════════════════════════════════════╝"
          );
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

          if (
            statusCode !==
            DisconnectReason.loggedOut
          ) {
            console.log(
              "🔄 Reconnecting WhatsApp..."
            );

            setTimeout(
              () => {
                startWhatsApp().catch(
                  error =>
                    console.error(
                      "❌ Reconnect failed:",
                      error
                    )
                );
              },
              3000
            );
          } else {
            console.log(
              "⚠️ WhatsApp session logged out."
            );
          }
        }
      }
    );

    return sock;

  } catch (error) {
    console.error(
      "❌ WhatsApp start failed:",
      error
    );

    throw error;
  }
}

// ═══════════════════════════════════════
// GET SOCKET
// ═══════════════════════════════════════

function getSocket() {
  return sock;
}

// ═══════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════

module.exports = {
  startWhatsApp,
  getSocket
};
