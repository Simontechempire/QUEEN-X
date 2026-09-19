const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const P = require("pino");
const path = require("path");
const fs = require("fs");

const sessionsDir = path.join(__dirname, "..", "sessions");

if (!fs.existsSync(sessionsDir)) {
  fs.mkdirSync(sessionsDir, { recursive: true });
}

const sockets = new Map();

async function createWhatsAppConnection(phone) {
  const sessionName = phone.replace(/\D/g, "");

  const sessionPath = path.join(
    sessionsDir,
    sessionName
  );

  const { state, saveCreds } =
    await useMultiFileAuthState(sessionPath);

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: "silent" }),
    printQRInTerminal: false,
    browser: [
      "Qᴜᴇᴇɴ X",
      "Chrome",
      "1.0.0"
    ]
  });

  sock.ev.on("creds.update", saveCreds);

  sockets.set(sessionName, sock);

  sock.ev.on("connection.update", (update) => {

    const {
      connection,
      lastDisconnect
    } = update;

    if (connection === "open") {
      console.log(
        `WhatsApp connected: ${sessionName}`
      );
    }

    if (connection === "close") {

      sockets.delete(sessionName);

      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;

      if (shouldReconnect) {
        console.log(
          `Reconnecting: ${sessionName}`
        );

        setTimeout(() => {
          createWhatsAppConnection(phone);
        }, 5000);
      }
    }
  });

  return sock;
}

async function generatePairingCode(phone) {

  if (!phone) {
    throw new Error("Phone number is required.");
  }

  const cleanPhone = phone.replace(/\D/g, "");

  if (!cleanPhone) {
    throw new Error("Invalid phone number.");
  }

  const sock = await createWhatsAppConnection(
    cleanPhone
  );

  if (!sock.authState?.creds?.registered) {

    await new Promise(resolve =>
      setTimeout(resolve, 2000)
    );

    const code =
      await sock.requestPairingCode(cleanPhone);

    return code;
  }

  return null;
}

module.exports = {
  createWhatsAppConnection,
  generatePairingCode
};
