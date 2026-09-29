const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestWaWebVersion
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
    throw new Error(
      "Session ID is required."
    );
  }

  if (sock) {
    return sock;
  }

  currentSessionId = sessionId;

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
  // 🌐 GET LIVE WHATSAPP WEB VERSION
  // ═════════════════════════════════════

  let version;

  try {

    const result =
      await fetchLatestWaWebVersion();

    if (
      !result ||
      !result.version
    ) {
      throw new Error(
        "Could not obtain the current WhatsApp Web version."
      );
    }

    version =
      result.version;

    console.log(
      `🌐 WhatsApp Web version: ${version.join(".")}`
    );

  } catch (error) {

    console.error(
      "❌ Could not fetch WhatsApp Web version:",
      error.message
    );

    throw new Error(
      "Unable to obtain the current WhatsApp Web version."
    );
  }


  // ═════════════════════════════════════
  // 🔌 CREATE SOCKET
  // ═════════════════════════════════════

  sock = makeWASocket({

    version,

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
  // 📡 CONNECTION EVENTS
  // ═════════════════════════════════════

  sock.ev.on(
    "connection.update",
    ({
      connection,
      lastDisconnect,
      qr
    }) => {

      if (
        connection === "connecting"
      ) {

        connectionState =
          "connecting";

        console.log(
          "🔄 Connecting to WhatsApp..."
        );
      }


      if (qr) {

        console.log(
          "📱 WhatsApp authentication stage ready."
        );
      }


      if (
        connection === "open"
      ) {

        connectionState =
          "open";

        pairingInProgress =
          false;

        reconnectTimer =
          null;

        console.log(
          `🟢 QUEEN X CONNECTED — SESSION ${sessionId}`
        );
      }


      if (
        connection === "close"
      ) {

        connectionState =
          "closed";

        const statusCode =
          lastDisconnect
            ?.error
            ?.output
            ?.statusCode;

        console.log(
          "❌ WhatsApp connection closed:",
          statusCode || "unknown"
        );


        const oldSocket =
          sock;

        sock = null;


        // ═══════════════════════════════
        // 🚪 LOGGED OUT
        // ═══════════════════════════════

        if (
          statusCode ===
          DisconnectReason.loggedOut
        ) {

          pairingInProgress =
            false;

          console.log(
            "🚪 WhatsApp session logged out."
          );

          return;
        }


        // ═══════════════════════════════
        // ⚠️ REJECTED
        // ═══════════════════════════════

        if (
          statusCode === 401 ||
          statusCode === 405
        ) {

          pairingInProgress =
            false;

          console.log(
            "⚠️ WhatsApp session rejected."
          );

          return;
        }


        // ═══════════════════════════════
        // 🔄 RECONNECT
        // ═══════════════════════════════

        if (
          oldSocket &&
          oldSocket.__intentionalClose
        ) {
          return;
        }


        if (
          !reconnectTimer &&
          currentSessionId
        ) {

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
  sessionId = null
) {

  if (!phoneNumber) {
    throw new Error(
      "WhatsApp phone number is required."
    );
  }


  const number =
    String(phoneNumber)
      .replace(/\D/g, "");


  if (
    number.length < 10
  ) {
    throw new Error(
      "Enter a valid international WhatsApp number."
    );
  }


  if (
    pairingInProgress
  ) {
    throw new Error(
      "A pairing request is already in progress."
    );
  }


  pairingInProgress =
    true;


  try {

    const finalSessionId =
      sessionId ||
      `pair_${Date.now()}`;


    // ═══════════════════════════════
    // 🧹 CLOSE OLD SOCKET
    // ═══════════════════════════════

    if (sock) {

      try {

        sock.__intentionalClose =
          true;

        sock.end(
          new Error(
            "Starting new pairing session"
          )
        );

      } catch (error) {

        console.log(
          "⚠️ Previous socket close:",
          error.message
        );
      }

      sock = null;

      connectionState =
        "closed";
    }


    currentSessionId =
      finalSessionId;


    console.log(
      `🆕 Creating WhatsApp session: ${finalSessionId}`
    );


    const socket =
      await startWhatsApp(
        finalSessionId
      );


    if (!socket) {

      throw new Error(
        "WhatsApp socket could not be created."
      );
    }


    // ═══════════════════════════════
    // ⏳ WAIT FOR CONNECTION STAGE
    // ═══════════════════════════════

    if (
      connectionState !==
        "connecting" &&
      connectionState !==
        "open"
    ) {

      await new Promise(
        (resolve, reject) => {

          let settled = false;

          const timeout =
            setTimeout(
              () => {

                if (settled) {
                  return;
                }

                settled = true;

                socket.ev.off(
                  "connection.update",
                  onUpdate
                );

                reject(
                  new Error(
                    "Timed out waiting for WhatsApp to initialize."
                  )
                );

              },
              30000
            );


          const onUpdate =
            ({
              connection
            }) => {

              if (
                settled
              ) {
                return;
              }

              if (
                connection ===
                  "connecting" ||
                connection ===
                  "open"
              ) {

                settled = true;

                clearTimeout(
                  timeout
                );

                socket.ev.off(
                  "connection.update",
                  onUpdate
                );

                resolve();
              }
            };


          socket.ev.on(
            "connection.update",
            onUpdate
          );

        }
      );
    }


    if (
      connectionState ===
      "open"
    ) {

      throw new Error(
        "This WhatsApp session is already connected."
      );
    }


    // ═══════════════════════════════
    // 🔑 REQUEST CODE
    // ═══════════════════════════════

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


    return String(code);

  } catch (error) {

    console.error(
      "❌ Pairing request failed:",
      error.message
    );

    throw error;

  } finally {

    pairingInProgress =
      false;
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

  getConnectionStatus,

  ensureAuthDirectory,

  getAuthPath

};
