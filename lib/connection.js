const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const fs = require("fs");
const path = require("path");

let sock = null;
let reconnectTimer = null;
let currentSessionId = null;
let connectionState = "closed";
let pairingInProgress = false;

const AUTH_DIR = path.join(
  __dirname,
  "..",
  "sessions"
);

// ═══════════════════════════════════════
// 📁 SESSION HELPERS
// ═══════════════════════════════════════

function ensureAuthDirectory() {
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, {
      recursive: true
    });
  }
}

function getAuthPath(sessionId) {
  ensureAuthDirectory();

  return path.join(
    AUTH_DIR,
    String(sessionId)
  );
}

// ═══════════════════════════════════════
// 👑 START WHATSAPP
// ═══════════════════════════════════════

async function startWhatsApp(sessionId) {

  if (!sessionId) {
    throw new Error("Session ID is required.");
  }

  currentSessionId = sessionId;

  if (sock) {
    return sock;
  }

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
      "Queen X",
      "Chrome",
      "1.0.0"
    ],

    printQRInTerminal: false,

    markOnlineOnConnect: false,

    syncFullHistory: false,

    generateHighQualityLinkPreview: false
  });

  sock.ev.on(
    "creds.update",
    saveCreds
  );

  sock.ev.on(
    "connection.update",
    ({
      connection,
      lastDisconnect
    }) => {

      if (connection === "connecting") {

        connectionState = "connecting";

        console.log(
          "🔄 Connecting to WhatsApp..."
        );
      }

      if (connection === "open") {

        connectionState = "open";

        pairingInProgress = false;

        reconnectTimer = null;

        console.log(
          `🟢 QUEEN X CONNECTED — SESSION ${sessionId}`
        );
      }

      if (connection === "close") {

        connectionState = "closed";

        pairingInProgress = false;

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

        if (
          statusCode ===
          DisconnectReason.loggedOut
        ) {

          console.log(
            "🚪 WhatsApp session logged out."
          );

          return;
        }

        if (
          statusCode === 401 ||
          statusCode === 405
        ) {

          console.log(
            "⚠️ WhatsApp session rejected."
          );

          return;
        }

        if (!reconnectTimer) {

          reconnectTimer =
            setTimeout(
              async () => {

                reconnectTimer = null;

                try {

                  await startWhatsApp(
                    currentSessionId
                  );

                } catch (error) {

                  console.error(
                    "❌ Reconnect failed:",
                    error.message
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
// 🔗 REQUEST NEW PAIRING CODE
// ═══════════════════════════════════════

async function requestPairingCode(phoneNumber) {

  if (!phoneNumber) {
    throw new Error(
      "WhatsApp phone number is required."
    );
  }

  const number =
    String(phoneNumber)
      .replace(/\D/g, "");

  if (number.length < 10) {
    throw new Error(
      "Enter a valid international WhatsApp number."
    );
  }

  if (pairingInProgress) {
    throw new Error(
      "A pairing request is already in progress."
    );
  }

  pairingInProgress = true;

  try {

    /*
     * IMPORTANT:
     * Every new pairing gets a fresh session.
     */

    const sessionId =
      `pair_${Date.now()}`;

    /*
     * If an old socket is still alive,
     * close it before creating the new one.
     */

    if (sock) {

      try {
        sock.end(
          new Error(
            "Starting new pairing session"
          )
        );
      } catch {}

      sock = null;
      connectionState = "closed";
    }

    currentSessionId = sessionId;

    console.log(
      `🆕 Creating fresh WhatsApp session: ${sessionId}`
    );

    const socket =
      await startWhatsApp(
        sessionId
      );

    if (!socket) {
      throw new Error(
        "WhatsApp socket could not be created."
      );
    }

    /*
     * Wait for the socket to initialize.
     */

    await new Promise(
      resolve =>
        setTimeout(resolve, 2500)
    );

    console.log(
      `🔗 Requesting pairing code for ${number}`
    );

    const code =
      await socket.requestPairingCode(
        number
      );

    if (!code) {
      throw new Error(
        "WhatsApp returned an empty pairing code."
      );
    }

    console.log(
      `🔑 Pairing code generated: ${code}`
    );

    return code;

  } catch (error) {

    console.error(
      "❌ Pairing request failed:",
      error
    );

    throw error;

  } finally {

    pairingInProgress = false;
  }
}

// ═══════════════════════════════════════
// 📡 SOCKET
// ═══════════════════════════════════════

function getSocket() {
  return sock;
}

// ═══════════════════════════════════════
// 📊 STATUS
// ═══════════════════════════════════════

function getConnectionStatus() {

  return {
    status: connectionState,
    connected:
      connectionState === "open",
    pairing:
      pairingInProgress,
    session:
      currentSessionId
  };
}

// ═══════════════════════════════════════
// 📤 EXPORT
// ═══════════════════════════════════════

module.exports = {
  startWhatsApp,
  requestPairingCode,
  getSocket,
  getConnectionStatus,
  ensureAuthDirectory,
  getAuthPath
};
