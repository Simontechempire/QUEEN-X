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
} = require("./lib/connect");

const app = express();
const PORT = process.env.PORT || 3000;

// ═══════════════════════════════════════
// 📁 DATA
// ═══════════════════════════════════════

const dataDir = path.join(__dirname, "data");
const USERS_FILE = path.join(dataDir, "users.json");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, {
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
// ⚙️ MIDDLEWARE
// ═══════════════════════════════════════

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true
  })
);

app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      "queen-x-change-this",

    resave: false,

    saveUninitialized: false,

    cookie: {
      httpOnly: true,

      secure:
        process.env.NODE_ENV === "production",

      sameSite: "lax",

      maxAge:
        24 * 60 * 60 * 1000
    }
  })
);

// ═══════════════════════════════════════
// 🌐 STATIC DASHBOARD
// ═══════════════════════════════════════

app.use(
  express.static(
    path.join(
      __dirname,
      "dashboard"
    )
  )
);

// ═══════════════════════════════════════
// 👥 USERS
// ═══════════════════════════════════════

function getUsers() {
  try {
    return JSON.parse(
      fs.readFileSync(
        USERS_FILE,
        "utf8"
      )
    );
  } catch (error) {
    console.error(
      "❌ Failed to read users:",
      error
    );

    return [];
  }
}

function saveUsers(users) {
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

// ═══════════════════════════════════════
// 🏠 HOME
// ═══════════════════════════════════════

app.get("/", (req, res) => {

  if (req.session.user) {
    return res.redirect(
      "/dashboard"
    );
  }

  res.sendFile(
    path.join(
      __dirname,
      "dashboard",
      "login.html"
    )
  );
});

// ═══════════════════════════════════════
// 📝 REGISTER
// ═══════════════════════════════════════

app.post(
  "/api/register",
  async (req, res) => {

    try {

      const {
        username,
        email,
        password
      } = req.body;

      if (
        !username ||
        !email ||
        !password
      ) {

        return res.status(400).json({
          success: false,
          message:
            "All fields are required."
        });
      }

      if (password.length < 6) {

        return res.status(400).json({
          success: false,
          message:
            "Password must contain at least 6 characters."
        });
      }

      const users = getUsers();

      const normalizedEmail =
        email
          .trim()
          .toLowerCase();

      const existingUser =
        users.find(
          user =>
            user.email ===
            normalizedEmail
        );

      if (existingUser) {

        return res.status(409).json({
          success: false,
          message:
            "An account with this email already exists."
        });
      }

      const hashedPassword =
        await bcrypt.hash(
          password,
          12
        );

      const newUser = {

        id:
          Date.now().toString(),

        username:
          username.trim(),

        email:
          normalizedEmail,

        password:
          hashedPassword,

        createdAt:
          new Date().toISOString()
      };

      users.push(newUser);

      saveUsers(users);

      return res.json({
        success: true,
        message:
          "Account created successfully."
      });

    } catch (error) {

      console.error(
        "❌ Registration error:",
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

      const {
        email,
        password
      } = req.body;

      if (!email || !password) {

        return res.status(400).json({
          success: false,
          message:
            "Email and password are required."
        });
      }

      const users = getUsers();

      const normalizedEmail =
        email
          .trim()
          .toLowerCase();

      const user =
        users.find(
          user =>
            user.email ===
            normalizedEmail
        );

      if (!user) {

        return res.status(401).json({
          success: false,
          message:
            "Invalid email or password."
        });
      }

      const validPassword =
        await bcrypt.compare(
          password,
          user.password
        );

      if (!validPassword) {

        return res.status(401).json({
          success: false,
          message:
            "Invalid email or password."
        });
      }

      req.session.user = {

        id: user.id,

        username:
          user.username,

        email:
          user.email
      };

      return res.json({
        success: true,
        message:
          "Login successful."
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
// 🛡️ AUTHENTICATION
// ═══════════════════════════════════════

function requireLogin(
  req,
  res,
  next
) {

  if (!req.session.user) {

    return res.status(401).json({
      success: false,
      message:
        "You must login first."
    });
  }

  next();
}

// ═══════════════════════════════════════
// 📊 DASHBOARD
// ═══════════════════════════════════════

app.get(
  "/dashboard",
  (req, res) => {

    if (!req.session.user) {

      return res.redirect(
        "/login.html"
      );
    }

    res.sendFile(
      path.join(
        __dirname,
        "dashboard",
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
  requireLogin,
  (req, res) => {

    res.json({
      success: true,
      user:
        req.session.user
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

      let {
        phoneNumber
      } = req.body;

      if (!phoneNumber) {

        return res.status(400).json({
          success: false,
          message:
            "WhatsApp phone number is required."
        });
      }

      // Remove + spaces and symbols
      phoneNumber =
        String(phoneNumber)
          .replace(/\D/g, "");

      if (phoneNumber.length < 10) {

        return res.status(400).json({
          success: false,
          message:
            "Enter a valid international WhatsApp number."
        });
      }

      console.log(
        `🔗 Pairing request from ${req.session.user.username}`
      );

      console.log(
        `📱 Number: ${phoneNumber}`
      );

      const code =
        await requestPairingCode(
          phoneNumber,
          "main"
        );

      return res.json({
        success: true,
        message:
          "WhatsApp pairing code generated.",
        pairingCode:
          code
      });

    } catch (error) {

      console.error(
        "❌ Pairing error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to generate WhatsApp pairing code."
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

      const status =
        getConnectionStatus();

      res.json({
        success: true,
        whatsapp:
          status
      });

    } catch (error) {

      res.status(500).json({
        success: false,
        message:
          "Unable to read WhatsApp status."
      });
    }
  }
);

// ═══════════════════════════════════════
// 🚪 LOGOUT
// ═══════════════════════════════════════

app.post(
  "/api/logout",
  requireLogin,
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

        res.json({
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

    res.json({

      status: "online",

      bot: "Qᴜᴇᴇɴ X",

      server: "online",

      uptime:
        Math.floor(
          process.uptime()
        ),

      whatsapp:
        getConnectionStatus(),

      timestamp:
        new Date().toISOString()
    });
  }
);

// ═══════════════════════════════════════
// ❌ API 404
// ═══════════════════════════════════════

app.use(
  "/api",
  (req, res) => {

    res.status(404).json({

      success: false,

      message:
        "API endpoint not found."
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

    console.log(`
╔══════════════════════════════════════╗
║          Qᴜᴇᴇɴ X SERVER             ║
╠══════════════════════════════════════╣
║ PORT: ${PORT}
║ STATUS: ONLINE
║ DASHBOARD: READY
║ WHATSAPP PAIRING: READY
╚══════════════════════════════════════╝
    `);

    // Start WhatsApp after HTTP server
    // is listening.
    startWhatsApp("main")
      .then(() => {

        console.log(
          "✅ WhatsApp connection initialized."
        );

      })
      .catch(error => {

        console.error(
          "❌ WhatsApp initialization failed:",
          error.message
        );

      });
  }
);
