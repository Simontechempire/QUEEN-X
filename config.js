require("dotenv").config();

module.exports = {
  bot: {
    name: process.env.BOT_NAME || "Qᴜᴇᴇɴ X",
    prefix: process.env.PREFIX || ".",
    ownerName: process.env.OWNER_NAME || "Simon Tech",
    ownerNumber: process.env.OWNER_NUMBER || ""
  },

  server: {
    port: Number(process.env.PORT) || 3000
  },

  dashboard: {
    url: process.env.DASHBOARD_URL || ""
  },

  database: {
    usersFile: "./data/users.json"
  },

  session: {
    secret:
      process.env.SESSION_SECRET ||
      "change-this-secret-before-deployment"
  },

  features: {
    autoRead: process.env.AUTO_READ === "true",
    autoTyping: process.env.AUTO_TYPING === "true",
    autoRecording: process.env.AUTO_RECORDING === "true"
  }
};
