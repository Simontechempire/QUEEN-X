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
let pairingPromise = null;

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


  // ═════════════════════════════════════
  // 💾 SAVE AUTH CREDENTIALS
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
    async ({
      connection,
      lastDisconnect,
      qr
    }) => {

      if (connection === "connecting") {

        connectionState = "connecting";

        console.log(
          "🔄 Connecting to WhatsApp..."
        );

        /*
         * Pairing is requested from
         * requestPairingCode(), which waits
         * for this connection stage.
         */
      }


      if (qr) {

        console.log(
          "📱 WhatsApp authentication stage ready."
        );
      }


      if (connection === "open") {

        connectionState = "open";

        pairingInProgress = false;

        pairingPromise = null;

        reconnectTimer = null;

        console.log(
          `🟢 QUEEN X CONNECTED — SESSION ${sessionId}`
        );
      }


      if (connection === "close") {

        connectionState = "closed";

        pairingInProgress = false;

        pairingPromise = null;

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
        // ⚠️ SESSION REJECTED
        // ═══════════════════════════════

        if (
          statusCode === 401 ||
          statusCode === 405
        ) {

          console.log(
            "⚠️ WhatsApp session rejected."
          );

          return;
        }


        // ═══════════════════════════════
        // 🔄 RECONNECT
        // ═══════════════════════════════

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


  pairingPromise =
    new Promise(
      async (resolve, reject) => {

        try {

          /*
           * Use supplied session ID or create
           * a fresh session.
           */

          const finalSessionId =
            sessionId ||
            `pair_${Date.now()}`;


          /*
           * Close previous socket if needed.
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


          /*
           * If credentials are already registered,
           * pairing is unnecessary.
           */

          if (
            socket.authState &&
            socket.authState.creds &&
            socket.authState.creds.registered
          ) {

            throw new Error(
              "This WhatsApp session is already registered."
            );

          }


          /*
           * Wait until Baileys reaches the
           * connecting stage.
           *
           * This is safer than using a fixed
           * 2.5-second delay.
           */

          let finished = false;


          const cleanup =
            () => {

              if (
                socket &&
                socket.ev
              ) {

                socket.ev.off(
                  "connection.update",
                  onUpdate
                );

              }

            };


          const timeout =
            setTimeout(
              () => {

                if (finished) {
                  return;
                }

                finished = true;

                cleanup();

                reject(
                  new Error(
                    "Timed out waiting for WhatsApp to initialize."
                  )
                );

              },
              30000
            );


          const onUpdate =
            async ({
              connection,
              qr
            }) => {

              if (finished) {
                return;
              }


              /*
               * Baileys documents pairing-code
               * requests during the connecting/QR
               * stage.
               */

              if (
                connection === "connecting" ||
                qr
              ) {

                try {

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


                  finished = true;

                  clearTimeout(
                    timeout
                  );

                  cleanup();


                  console.log(
                    `🔑 Pairing code generated: ${code}`
                  );


                  resolve(
                    String(code)
                  );

                } catch (error) {

                  finished = true;

                  clearTimeout(
                    timeout
                  );

                  cleanup();

                  reject(error);

                }

              }

            };


          socket.ev.on(
            "connection.update",
            onUpdate
          );


        } catch (error) {

          reject(error);

        }

      }
    );


  try {

    return await pairingPromise;

  } finally {

    pairingInProgress = false;

    pairingPromise = null;

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
