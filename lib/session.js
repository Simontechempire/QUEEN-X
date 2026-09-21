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
let currentSessionId = "main";
let connectionState = "closed";
let pairingInProgress = false;

// ═══════════════════════════════════════
// 📁 SESSION DIRECTORY
// ═══════════════════════════════════════

const AUTH_DIR = path.join(
  __dirname,
  "..",
  "sessions"
);

function ensureAuthDirectory() {
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, {
      recursive: true
    });
  }
}

function getAuthPath(sessionId = "main") {
  ensureAuthDirectory();

  const safeId = String(sessionId).replace(
    /[^a-zA-Z0-9_-]/g,
    ""
  );

  if (!safeId) {
    throw new Error("Invalid session ID.");
  }

  const sessionPath = path.join(
    AUTH_DIR,
    safeId
  );

  if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, {
      recursive: true
    });
  }

  return sessionPath;
}

// ═══════════════════════════════════════
// 👑 START WHATSAPP
// ═══════════════════════════════════════

async function startWhatsApp(sessionId = "main") {

  currentSessionId = sessionId;

  if (sock) {
    return sock;
  }

  ensureAuthDirectory();

  const sessionPath =
    getAuthPath(sessionId);

  console.log(
    "📁 WhatsApp session:",
    sessionPath
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

  // ═════════════════════════════════════
  // 💾 SAVE CREDENTIALS
  // ═════════════════════════════════════

  sock.ev.on(
    "creds.update",
    saveCreds
  );

  // ═════════════════════════════════════
  // 📡 CONNECTION
  // ═════════════════════════════════════

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
          "🟢 QUEEN X WhatsApp connected"
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
            "⚠️ WhatsApp session rejected. Fresh pairing may be required."
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
// 🔗 REQUEST PAIRING CODE
// ═══════════════════════════════════════

async function requestPairingCode(
  phoneNumber,
  sessionId = "main"
) {

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
      "Pairing already in progress. Please wait."
    );
  }

  pairingInProgress = true;

  try {

    const socket =
      await startWhatsApp(sessionId);

    if (!socket) {
      throw new Error(
        "WhatsApp socket could not be created."
      );
    }

    console.log(
      "🔗 Requesting pairing code for:",
      number
    );

    // Give the socket a moment to initialize.
    if (
      connectionState === "connecting" ||
      connectionState === "closed"
    ) {

      await new Promise(
        resolve =>
          setTimeout(resolve, 2000)
      );
    }

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
      "🔑 Pairing code:",
      code
    );

    return code;

  } catch (error) {

    console.error(
      "❌ Pairing error:",
      error
    );

    throw error;

  } finally {

    pairingInProgress = false;
  }
}

// ═══════════════════════════════════════
// 📡 GET SOCKET
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
