require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const session = require("express-session");

const {
  startWhatsApp,
  requestPairingCode,
  getConnectionStatus
} = require("./lib/connection");

const app = express();

const PORT =
  Number(process.env.PORT) || 3000;

const DATA_DIR =
  path.join(__dirname, "data");

const USERS_FILE =
  path.join(DATA_DIR, "users.json");

const DASHBOARD_DIR =
  path.join(__dirname, "dashboard");

// ═══════════════════════════════════════
// 📁 DATA SETUP
// ═══════════════════════════════════════

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, {
    recursive: true
  });
}

if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(
    USERS_FILE,
    "[]",
    "utf8"
  );
}

// ═══════════════════════════════════════
// 🔧 HELPERS
// ═══════════════════════════════════════

function readUsers() {
  try {
    const data =
      fs.readFileSync(
        USERS_FILE,
        "utf8"
      );

    return JSON.parse(data);
  } catch (error) {
    console.error(
      "❌ Could not read users:",
      error.message
    );

    return [];
  }
}

function writeUsers(users) {
  fs.writeFileSync(
    USERS_FILE,
    JSON.stringify(
      users,
      null,
      2
    ),
    "utf8"
  );
}

function requireLogin(
  req,
  res,
  next
) {
  if (!req.session.user) {
    return res.status(401).json({
      success: false,
      message: "Please login first."
    });
  }

  next();
}

// ═══════════════════════════════════════
// 🌐 EXPRESS CONFIG
// ═══════════════════════════════════════

app.set(
  "trust proxy",
  1
);

app.use(
  express.json({
    limit: "1mb"
  })
);

app.use(
  express.urlencoded({
    extended: true
  })
);

app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      "queen-x-change-this-secret",

    resave: false,

    saveUninitialized: false,

    cookie: {
      httpOnly: true,

      secure:
        process.env.NODE_ENV ===
        "production",

      sameSite: "lax",

      maxAge:
        1000 *
        60 *
        60 *
        24 *
        7
    }
  })
);

// ═══════════════════════════════════════
// 📂 DASHBOARD
// ═══════════════════════════════════════

app.use(
  express.static(
    DASHBOARD_DIR
  )
);

// ═══════════════════════════════════════
// 🏠 HOME
// ═══════════════════════════════════════

app.get(
  "/",
  (req, res) => {
    res.sendFile(
      path.join(
        DASHBOARD_DIR,
        "index.html"
      )
    );
  }
);

// ═══════════════════════════════════════
// 📝 REGISTER
// ═══════════════════════════════════════

app.post(
  "/api/register",
  async (req, res) => {
    try {
      const username =
        String(
          req.body.username || ""
        ).trim();

      const password =
        String(
          req.body.password || ""
        );

      if (
        !username ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Username and password are required."
        });
      }

      if (username.length < 3) {
        return res.status(400).json({
          success: false,
          message:
            "Username must be at least 3 characters."
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message:
            "Password must be at least 6 characters."
        });
      }

      const users =
        readUsers();

      const exists =
        users.some(
          user =>
            user.username
              .toLowerCase() ===
            username.toLowerCase()
        );

      if (exists) {
        return res.status(409).json({
          success: false,
          message:
            "Username already exists."
        });
      }

      const passwordHash =
        await bcrypt.hash(
          password,
          10
        );

      users.push({
        id:
          Date.now().toString(),

        username,

        password:
          passwordHash,

        createdAt:
          new Date().toISOString()
      });

      writeUsers(users);

      return res.json({
        success: true,
        message:
          "Registration successful."
      });

    } catch (error) {
      console.error(
        "❌ Register error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Registration failed."
      });
    }
  }
);

// ═══════════════════════════════════════
// 🔐 LOGIN
// ═══════════════════════════════════════

app.post(
  "/api/login",
  async (req, res) => {
    try {
      const username =
        String(
          req.body.username || ""
        ).trim();

      const password =
        String(
          req.body.password || ""
        );

      if (
        !username ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Username and password are required."
        });
      }

      const users =
        readUsers();

      const user =
        users.find(
          item =>
            item.username
              .toLowerCase() ===
            username.toLowerCase()
        );

      if (!user) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid username or password."
        });
      }

      const valid =
        await bcrypt.compare(
          password,
          user.password
        );

      if (!valid) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid username or password."
        });
      }

      req.session.user = {
        id: user.id,
        username: user.username
      };

      return res.json({
        success: true,
        message:
          "Login successful.",
        user: {
          id: user.id,
          username:
            user.username
        }
      });

    } catch (error) {
      console.error(
        "❌ Login error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Login failed."
      });
    }
  }
);

// ═══════════════════════════════════════
// 📊 DASHBOARD
// ═══════════════════════════════════════

app.get(
  "/dashboard",
  requireLogin,
  (req, res) => {
    res.sendFile(
      path.join(
        DASHBOARD_DIR,
        "index.html"
      )
    );
  }
);

// ═══════════════════════════════════════
// 👤 CURRENT USER
// ═══════════════════════════════════════

app.get(
  "/api/me",
  (req, res) => {
    if (!req.session.user) {
      return res.json({
        success: false,
        loggedIn: false
      });
    }

    return res.json({
      success: true,
      loggedIn: true,
      user: req.session.user
    });
  }
);

// ═══════════════════════════════════════
// 🔗 WHATSAPP PAIRING
// ═══════════════════════════════════════

app.post(
  "/api/pair",
  requireLogin,
  async (req, res) => {
    try {
      let phone =
        req.body.phone ||
        req.body.phoneNumber ||
        "";

      /*
       * Keep digits only.
       *
       * Example:
       * +234 801 234 5678
       * becomes:
       * 2348012345678
       */
      phone =
        String(phone)
          .replace(/\D/g, "");

      if (!phone) {
        return res.status(400).json({
          success: false,
          message:
            "WhatsApp phone number is required."
        });
      }

      if (phone.length < 10) {
        return res.status(400).json({
          success: false,
          message:
            "Enter a valid international WhatsApp number."
        });
      }

      console.log(
        `📱 Pairing request from ${req.session.user.username}`
      );

      console.log(
        `🔗 WhatsApp number: ${phone}`
      );

      /*
       * "main" gives the bot one persistent
       * logical session instead of creating
       * a new session on every button press.
       */
      const code =
        await requestPairingCode(
          phone,
          "main"
        );

      if (!code) {
        throw new Error(
          "WhatsApp returned an empty pairing code."
        );
      }

      return res.json({
        success: true,

        message:
          "Pairing code generated.",

        code:
          String(code),

        pairingCode:
          String(code)
      });

    } catch (error) {
      console.error(
        "❌ Pairing API error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Unable to generate WhatsApp pairing code."
      });
    }
  }
);

// ═══════════════════════════════════════
// 📡 WHATSAPP STATUS
// ═══════════════════════════════════════

app.get(
  "/api/whatsapp/status",
  requireLogin,
  (req, res) => {
    try {
      return res.json({
        success: true,
        ...getConnectionStatus()
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          "Unable to get WhatsApp status."
      });
    }
  }
);

// ═══════════════════════════════════════
// 📊 SESSION STATUS
// ═══════════════════════════════════════

app.get(
  "/api/session",
  requireLogin,
  (req, res) => {
    try {
      const status =
        getConnectionStatus();

      return res.json({
        success: true,

        connected:
          status.connected,

        status:
          status.status,

        pairing:
          status.pairing,

        session:
          status.session
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          "Unable to check session."
      });
    }
  }
);

// ═══════════════════════════════════════
// 🚪 LOGOUT
// ═══════════════════════════════════════

app.post(
  "/api/logout",
  (req, res) => {
    req.session.destroy(
      error => {
        if (error) {
          console.error(
            "❌ Logout error:",
            error
          );

          return res.status(500).json({
            success: false,
            message:
              "Logout failed."
          });
        }

        res.clearCookie(
          "connect.sid"
        );

        return res.json({
          success: true,
          message:
            "Logged out successfully."
        });
      }
    );
  }
);

// ═══════════════════════════════════════
// ❤️ HEALTH CHECK
// ═══════════════════════════════════════

app.get(
  "/health",
  (req, res) => {
    return res.status(200).json({
      success: true,
      service:
        "QUEEN X",
      status:
        "online",
      whatsapp:
        getConnectionStatus()
    });
  }
);

// ═══════════════════════════════════════
// ❌ UNKNOWN API
// ═══════════════════════════════════════

app.use(
  "/api",
  (req, res) => {
    return res.status(404).json({
      success: false,
      message:
        "API endpoint not found."
    });
  }
);

// ═══════════════════════════════════════
// ⚠️ ERROR HANDLER
// ═══════════════════════════════════════

app.use(
  (error, req, res, next) => {
    console.error(
      "❌ Server error:",
      error
    );

    if (res.headersSent) {
      return next(error);
    }

    return res.status(500).json({
      success: false,
      message:
        "Internal server error."
    });
  }
);

// ═══════════════════════════════════════
// 🚀 START SERVER
// ═══════════════════════════════════════

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log("");

    console.log(
      "╔══════════════════════════════════════╗"
    );

    console.log(
      "║             👑 QUEEN X              ║"
    );

    console.log(
      "║          WHATSAPP MD BOT            ║"
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
      "║  ❤️ Health check: /health            ║"
    );

    console.log(
      "╚══════════════════════════════════════╝"
    );

    console.log("");
  }
);
