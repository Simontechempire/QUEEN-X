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
// 👑 CREATE WHATSAPP CONNECTION
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


  // SAVE CREDENTIALS
  sock.ev.on(
    "creds.update",
    saveCreds
  );


  // CONNECTION EVENTS
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
          "╔══════════════════════════════╗"
        );

        console.log(
          "║ 👑 QUEEN X WHATSAPP          ║"
        );

        console.log(
          "║ 🟢 CONNECTED                 ║"
        );

        console.log(
          `║ SESSION: ${sessionId}              ║`
        );

        console.log(
          "╚══════════════════════════════╝"
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
                    "❌ Reconnection failed:",
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
      "Enter a valid international phone number."
    );
  }


  if (pairingInProgress) {

    throw new Error(
      "A pairing request is already in progress."
    );
  }


  pairingInProgress = true;


  try {

    const socket =
      await startWhatsApp(
        sessionId
      );


    /*
     * Do not request a pairing code
     * from an already registered session.
     */

    if (
      socket.authState?.creds?.registered ||
      socket.user
    ) {

      throw new Error(
        "This WhatsApp session is already registered. Delete the old session before pairing again."
      );
    }


    console.log(
      `🔗 Requesting pairing code for ${number}`
    );


    /*
     * WhatsApp pairing codes should be
     * requested while the socket is active.
     */

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
      error.message
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
// 📊 CONNECTION STATUS
// ═══════════════════════════════════════

function getConnectionStatus() {

  return {

    status:
      connectionState,

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
