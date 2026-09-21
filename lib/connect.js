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
// 👑 QUEEN X — CREATE WHATSAPP SOCKET
// ═══════════════════════════════════════

async function startWhatsApp(sessionId = "main") {

  currentSessionId = sessionId;

  // Reuse active socket
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


  // ═════════════════════════════════════
  // 🚫 DO NOT START ANOTHER SOCKET
  // ═════════════════════════════════════

  if (sock) {
    return sock;
  }


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
    async () => {

      try {

        await saveCreds();

        console.log(
          "💾 WhatsApp credentials saved."
        );

      } catch (error) {

        console.error(
          "❌ Failed to save credentials:",
          error
        );

      }

    }
  );


  // ═════════════════════════════════════
  // 📡 CONNECTION UPDATE
  // ═════════════════════════════════════

  sock.ev.on(
    "connection.update",
    async ({
      connection,
      lastDisconnect
    }) => {

      if (connection === "connecting") {

        connectionState =
          "connecting";

        console.log(
          "🔄 Connecting to WhatsApp..."
        );
      }


      // ═══════════════════════════════
      // 🟢 CONNECTED
      // ═══════════════════════════════

      if (connection === "open") {

        connectionState =
          "open";

        pairingInProgress =
          false;

        reconnectTimer = null;

        console.log(`
╔══════════════════════════════════════╗
║          Qᴜᴇᴇɴ X WHATSAPP           ║
╠══════════════════════════════════════╣
║          🟢 CONNECTED                ║
║          SESSION: ${sessionId}
╚══════════════════════════════════════╝
        `);
      }


      // ═══════════════════════════════
      // 🔴 CONNECTION CLOSED
      // ═══════════════════════════════

      if (connection === "close") {

        connectionState =
          "closed";

        pairingInProgress =
          false;

        const statusCode =
          lastDisconnect
            ?.error
            ?.output
            ?.statusCode;


        console.log(
          "❌ WhatsApp connection closed:",
          statusCode || "unknown"
        );


        // Important:
        // remove old socket before reconnecting

        sock = null;


        // ═══════════════════════════════
        // 🚪 LOGGED OUT
        // ═══════════════════════════════

        if (
          statusCode ===
          DisconnectReason.loggedOut
        ) {

          console.log(
            "🚪 WhatsApp session logged out."
          );

          return;
        }


        // ═══════════════════════════════
        // 🚫 BAD SESSION / REJECTED
        // ═══════════════════════════════

        if (
          statusCode === 405 ||
          statusCode === 401
        ) {

          console.log(`
⚠️ QUEEN X WhatsApp session rejected.

Delete the old authentication
session and request a new
pairing code.
          `);

          return;
        }


        // ═══════════════════════════════
        // 🔄 RECONNECT
        // ═══════════════════════════════

        if (!reconnectTimer) {

          reconnectTimer =
            setTimeout(
              async () => {

                reconnectTimer =
                  null;

                try {

                  await startWhatsApp(
                    currentSessionId
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


  if (!number) {

    throw new Error(
      "Invalid WhatsApp phone number."
    );
  }


  if (number.length < 10) {

    throw new Error(
      "Phone number is too short."
    );
  }


  // ═════════════════════════════════════
  // 🔐 PREVENT DUPLICATE REQUESTS
  // ═════════════════════════════════════

  if (pairingInProgress) {

    throw new Error(
      "A pairing request is already in progress. Please wait."
    );
  }


  pairingInProgress =
    true;


  try {

    // ═══════════════════════════════════
    // START / REUSE SOCKET
    // ═══════════════════════════════════

    const socket =
      await startWhatsApp(
        sessionId
      );


    if (!socket) {

      throw new Error(
        "WhatsApp socket could not be created."
      );
    }


    // ═══════════════════════════════════
    // CHECK AUTH STATE
    // ═══════════════════════════════════

    if (
      socket.authState &&
      socket.authState.creds &&
      socket.authState.creds.registered
    ) {

      throw new Error(
        "This WhatsApp session is already registered. Use a fresh session."
      );
    }


    if (socket.user) {

      throw new Error(
        "This WhatsApp session is already connected."
      );
    }


    console.log(
      `🔗 Requesting pairing code for ${number}`
    );


    // ═══════════════════════════════════
    // WAIT A LITTLE FOR SOCKET
    // ═══════════════════════════════════

    if (
      connectionState === "closed"
    ) {

      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            1500
          )
      );
    }


    // ═══════════════════════════════════
    // REQUEST CODE
    // ═══════════════════════════════════

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

    // Do NOT destroy the socket here.
    // It must remain alive so WhatsApp
    // can complete the linking process.

    pairingInProgress =
      false;
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
