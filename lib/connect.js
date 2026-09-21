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

// ═══════════════════════════════════════
// 👑 QUEEN X — WHATSAPP CONNECTION
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
📁 WhatsApp session: ${sessionPath}
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
  "Qᴜᴇᴇɴ X",  
  "Chrome",  
  "1.0.0"  
],  

printQRInTerminal: false,  

markOnlineOnConnect: false,  

syncFullHistory: false

});

// ═════════════════════════════════════
// 💾 SAVE CREDENTIALS
// ═════════════════════════════════════

sock.ev.on(
"creds.update",
saveCreds
);

// ═════════════════════════════════════
// 📡 CONNECTION UPDATE
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
    // 🚫 405  
    // ═══════════════════════════════  

    if (statusCode === 405) {  

      console.log(`

⚠️ Qᴜᴇᴇɴ X received WhatsApp
status 405.

The WhatsApp session was rejected.
A fresh pairing session may be required.
`);

return;  
    }  

    // ═══════════════════════════════  
    // 🔄 RECONNECT  
    // ═══════════════════════════════  

    if (!reconnectTimer) {  

      console.log(  
        "🔄 Reconnecting WhatsApp in 5 seconds..."  
      );  

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

// Remove +, spaces, brackets and dashes
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

// Start socket if it does not exist
if (!sock) {

await startWhatsApp(  
  sessionId  
);

}

// If already registered, pairing code
// should not be requested again.
if (
sock.user ||
sock.authState?.creds?.registered
) {

throw new Error(  
  "This WhatsApp session is already registered."  
);

}

console.log(
🔗 Requesting WhatsApp pairing code for ${number}
);

try {

const code =  
  await sock.requestPairingCode(  
    number  
  );  

console.log(  
  `🔑 WhatsApp pairing code: ${code}`  
);  

return code;

} catch (error) {

console.error(  
  "❌ Pairing code request failed:",  
  error  
);  

throw error;

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
status: connectionState,
connected:
connectionState === "open",
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
