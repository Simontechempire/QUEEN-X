require("dotenv").config();

const app = require("./server");

const PORT =
  process.env.PORT || 3000;

app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log("");
    console.log(
      "╔══════════════════════════════════════╗"
    );
    console.log(
      "║           👑 QUEEN X                 ║"
    );
    console.log(
      "║        WHATSAPP MD BOT               ║"
    );
    console.log(
      "╠══════════════════════════════════════╣"
    );
    console.log(
      `║  🟢 Server running on port ${PORT}       ║`
    );
    console.log(
      "║  🔐 Login/Register enabled           ║"
    );
    console.log(
      "║  🔗 WhatsApp pairing ready           ║"
    );
    console.log(
      "╚══════════════════════════════════════╝"
    );
    console.log("");

  }
);
