const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const fs = require("fs");
const path = require("path");

const AUTH_DIR = path.join(
  __dirname,
  "..",
  "sessions"
);

// Keep sockets per session
const sockets = new Map();
const states = new Map();
const reconnectTimers = new Map();
const pairingLocks = new Set();


// ═══════════════════════════════════════
// 📁 SESSION DIRECTORY
// ═══════════════════════════════════════

function ensureAuthDirectory() {
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, {
      recursive: true
    });
  }
}


// ═══════════════════════════════════════
// 📁 SESSION PATH
// ═══════════════════════════════════════

function getAuthPath(sessionId) {

  if (!sessionId) {
    throw new Error("Session ID is required.");
  }

  ensureAuthDirectory();

  return path.join(
    AUTH_DIR,
    String(sessionId)
  );
}


// ═══════════════════════════════════════
// 👑 START WHATSAPP SESSION
// ═══════════════════════════════════════

async function startWhatsApp(sessionId) {

  if (!sessionId) {
    throw new Error("Session ID is required.");
  }

  const id = String(sessionId);

  // Reuse existing socket for this user
  if (sockets.has(id)) {
    return sockets.get(id);
  }

  const sessionPath = getAuthPath(id);

  console.log(
    `📁 WhatsApp session: ${sessionPath}`
  );

  const {
    state,
    saveCreds
  } = await useMultiFileAuthState(
    sessionPath
  );

  const socket = makeWASocket({

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


  sockets.set(id, socket);

  states.set(id, "connecting");


  // ═════════════════════════════════════
  // 💾 SAVE CREDENTIALS
  // ═════════════════════════════════════

  socket.ev.on(
    "creds.update",
    async () => {

      try {

        await saveCreds();

      } catch (error) {

        console.error(
          `❌ Failed to save credentials for ${id}:`,
          error.message
        );

      }

    }
  );


  // ═════════════════════════════════════
  // 📡 CONNECTION UPDATE
  // ═════════════════════════════════════

  socket.ev.on(
    "connection.update",
    ({
      connection,
      lastDisconnect
    }) => {

      if (connection === "connecting") {

        states.set(
          id,
          "connecting"
        );

        console.log(
          `🔄 WhatsApp connecting — ${id}`
        );
      }


      // ═══════════════════════════════
      // 🟢 CONNECTED
      // ═══════════════════════════════

      if (connection === "open") {

        states.set(
          id,
          "open"
        );

        pairingLocks.delete(id);

        console.log(
          `🟢 QUEEN X CONNECTED — SESSION ${id}`
        );
      }


      // ═══════════════════════════════
      // 🔴 CLOSED
      // ═══════════════════════════════

      if (connection === "close") {

        states.set(
          id,
          "closed"
        );

        pairingLocks.delete(id);

        const statusCode =
          lastDisconnect
            ?.error
            ?.output
            ?.statusCode;

        console.log(
          `❌ WhatsApp connection closed — ${id}:`,
          statusCode || "unknown"
        );


        // Remove this socket only
        sockets.delete(id);


        // ═══════════════════════════════
        // 🚪 LOGGED OUT
        // ═══════════════════════════════

        if (
          statusCode ===
          DisconnectReason.loggedOut
        ) {

          console.log(
            `🚪 WhatsApp logged out — ${id}`
          );

          return;
        }


        // ═══════════════════════════════
        // 🚫 SESSION REJECTED
        // ═══════════════════════════════

        if (
          statusCode === 401 ||
          statusCode === 405
        ) {

          console.log(
            `⚠️ WhatsApp session rejected — ${id}`
          );

          return;
        }


        // ═══════════════════════════════
        // 🔄 RECONNECT
        // ═══════════════════════════════

        if (
          !reconnectTimers.has(id)
        ) {

          const timer =
            setTimeout(
              async () => {

                reconnectTimers.delete(id);

                try {

                  await startWhatsApp(id);

                } catch (error) {

                  console.error(
                    `❌ Reconnect failed — ${id}:`,
                    error.message
                  );

                }

              },
              5000
            );

          reconnectTimers.set(
            id,
            timer
          );
        }

      }

    }
  );


  return socket;
}


// ═══════════════════════════════════════
// 🔗 REQUEST PAIRING CODE
// ═══════════════════════════════════════

async function requestPairingCode(
  phoneNumber,
  sessionId
) {

  if (!phoneNumber) {
    throw new Error(
      "WhatsApp phone number is required."
    );
  }

  if (!sessionId) {
    throw new Error(
      "Session ID is required."
    );
  }


  const id =
    String(sessionId);


  const number =
    String(phoneNumber)
      .replace(/\D/g, "");


  if (number.length < 10) {

    throw new Error(
      "Enter a valid international WhatsApp number."
    );

  }


  // Prevent two pairing requests
  // for the same user at once.

  if (pairingLocks.has(id)) {

    throw new Error(
      "A pairing request is already in progress. Please wait."
    );

  }


  pairingLocks.add(id);


  try {

    // ═══════════════════════════════════
    // CHECK EXISTING SESSION
    // ═══════════════════════════════════

    const existingSocket =
      sockets.get(id);


    if (existingSocket) {

      const currentState =
        states.get(id);


      if (
        currentState === "open" &&
        existingSocket.user
      ) {

        throw new Error(
          "This WhatsApp session is already connected."
        );

      }


      // Close an unfinished socket
      try {

        existingSocket.end(
          new Error(
            "Starting fresh pairing"
          )
        );

      } catch {}

      sockets.delete(id);

    }


    // ═══════════════════════════════════
    // START SESSION
    // ═══════════════════════════════════

    console.log(
      `🆕 Starting pairing session: ${id}`
    );


    const socket =
      await startWhatsApp(id);


    // ═══════════════════════════════════
    // WAIT FOR CONNECTION INITIALIZATION
    // ═══════════════════════════════════

    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          2000
        )
    );


    // ═══════════════════════════════════
    // REQUEST CODE
    // ═══════════════════════════════════

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
      `🔑 Pairing code generated for ${id}: ${code}`
    );


    return code;

  } catch (error) {

    console.error(
      `❌ Pairing failed — ${id}:`,
      error.message
    );

    throw error;

  } finally {

    pairingLocks.delete(id);

  }

}


// ═══════════════════════════════════════
// 📡 GET SOCKET
// ═══════════════════════════════════════

function getSocket(sessionId) {

  if (!sessionId) {
    return null;
  }

  return sockets.get(
    String(sessionId)
  ) || null;
}


// ═══════════════════════════════════════
// 📊 CONNECTION STATUS
// ═══════════════════════════════════════

function getConnectionStatus(sessionId) {

  if (!sessionId) {

    return {
      status: "closed",
      connected: false,
      pairing: false,
      session: null
    };

  }


  const id =
    String(sessionId);


  const status =
    states.get(id) || "closed";


  return {

    status,

    connected:
      status === "open",

    pairing:
      pairingLocks.has(id),

    session:
      id

  };

}


// ═══════════════════════════════════════
// 🚪 LOGOUT / REMOVE SESSION
// ═══════════════════════════════════════

async function logoutSession(sessionId) {

  const id =
    String(sessionId);

  const socket =
    sockets.get(id);


  if (socket) {

    try {

      await socket.logout();

    } catch (error) {

      console.error(
        `Logout error — ${id}:`,
        error.message
      );

    }

  }


  sockets.delete(id);

  states.delete(id);

  pairingLocks.delete(id);


  const timer =
    reconnectTimers.get(id);


  if (timer) {

    clearTimeout(timer);

    reconnectTimers.delete(id);

  }

}


// ═══════════════════════════════════════
// 📤 EXPORT
// ═══════════════════════════════════════

module.exports = {

  startWhatsApp,

  requestPairingCode,

  getSocket,

  getConnectionStatus,

  logoutSession,

  ensureAuthDirectory,

  getAuthPath

};
