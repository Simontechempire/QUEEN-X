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

let currentSessionId = "main";
let connectionState = "closed";
let pairingInProgress = false;


// ═══════════════════════════════════════
// 👑 QUEEN X — START WHATSAPP
// ═══════════════════════════════════════

async function startWhatsApp(sessionId = "main") {

  currentSessionId = sessionId;

  if (sock) {
    return sock;
  }

  ensureAuthDirectory();

  const sessionPath = getAuthPath(sessionId);

  console.log(`📁 WhatsApp session: ${sessionPath}`);

  const {
    state,
    saveCreds
  } = await useMultiFileAuthState(sessionPath);

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

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on(
    "connection.update",
    ({ connection, lastDisconnect }) => {

      if (connection === "connecting") {

        connectionState = "connecting";

        console.log(
          "🔄 Queen X connecting to WhatsApp..."
        );
      }


      if (connection === "open") {

        connectionState = "open";

        pairingInProgress = false;

        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }

        console.log(
          "🟢 QUEEN X WHATSAPP CONNECTED"
        );
      }


      if (connection === "close") {

        connectionState = "closed";

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

        /*
         * If the account was successfully logged out,
         * don't automatically recreate the socket.
         */

        if (
          statusCode === DisconnectReason.loggedOut
        ) {

          console.log(
            "🚪 WhatsApp session logged out."
          );

          return;
        }


        /*
         * 405 / 401 normally means the existing
         * authentication state is unusable.
         */

        if (
          statusCode === 405 ||
          statusCode === 401
        ) {

          console.log(
            "⚠️ WhatsApp authentication rejected."
          );

          return;
        }


        /*
         * Reconnect after temporary connection loss.
         */

        if (!reconnectTimer) {

          reconnectTimer = setTimeout(
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
    String(phoneNumber).replace(/\D/g, "");

  if (number.length < 10) {
    throw new Error(
      "Enter a valid international WhatsApp number."
    );
  }

  if (pairingInProgress) {
    throw new Error(
      "A pairing request is already running. Please wait."
    );
  }

  pairingInProgress = true;

  try {

    /*
     * If an old socket exists but isn't useful,
     * remove it before creating a fresh pairing socket.
     */

    if (
      sock &&
      connectionState === "open"
    ) {

      throw new Error(
        "WhatsApp is already connected."
      );
    }


    const socket =
      await startWhatsApp(sessionId);


    if (!socket) {
      throw new Error(
        "Unable to create WhatsApp connection."
      );
    }


    /*
     * Give the Baileys socket a moment to establish
     * the WebSocket connection before requesting
     * the pairing code.
     */

    if (
      connectionState === "connecting"
    ) {

      await waitForConnectionReady(
        15000
      );
    }


    /*
     * Never request another pairing code from an
     * already registered account.
     */

    if (
      socket.user ||
      socket.authState?.creds?.registered
    ) {

      throw new Error(
        "This session is already registered. Delete the old session before pairing again."
      );
    }


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
      "❌ Pairing error:",
      error
    );

    throw error;

  } finally {

    pairingInProgress = false;
  }
}


// ═══════════════════════════════════════
// ⏳ WAIT FOR SOCKET
// ═══════════════════════════════════════

function waitForConnectionReady(timeout = 15000) {

  return new Promise((resolve, reject) => {

    const started = Date.now();

    const timer = setInterval(() => {

      if (
        connectionState === "connecting"
      ) {

        if (
          Date.now() - started >= timeout
        ) {

          clearInterval(timer);

          reject(
            new Error(
              "WhatsApp connection timed out. Please try again."
            )
          );
        }

        return;
      }

      if (
        connectionState === "open" ||
        connectionState === "closed"
      ) {

        clearInterval(timer);

        resolve();
      }

    }, 250);
  });
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
  getConnectionStatus
};
