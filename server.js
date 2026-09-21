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

const dataDir = path.join(__dirname, "data");
const USERS_FILE = path.join(dataDir, "users.json");

// ═══════════════════════════════════════
// DATA SETUP
// ═══════════════════════════════════════

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, "[]", "utf8");
}

// ═══════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("trust proxy", 1);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "queen-x-change-this-secret",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000
    }
  })
);

app.use(express.static(path.join(__dirname, "dashboard")));

// ═══════════════════════════════════════
// USER DATABASE
// ═══════════════════════════════════════

function getUsers() {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
  } catch (error) {
    console.error("❌ Failed to read users:", error);
    return [];
  }
}

function saveUsers(users) {
  fs.writeFileSync(
    USERS_FILE,
    JSON.stringify(users, null, 2),
    "utf8"
  );
}

// ═══════════════════════════════════════
// HOME
// ═══════════════════════════════════════

app.get("/", (req, res) => {
  if (req.session.user) {
    return res.redirect("/dashboard");
  }

  res.sendFile(
    path.join(__dirname, "dashboard", "login.html")
  );
});

// ═══════════════════════════════════════
// REGISTER
// ═══════════════════════════════════════

app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email and password are required."
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters."
      });
    }

    const users = getUsers();

    const normalizedEmail = String(email)
      .trim()
      .toLowerCase();

    if (
      users.some(
        user => user.email === normalizedEmail
      )
    ) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = {
      id: Date.now().toString(),
      username: String(username).trim(),
      email: normalizedEmail,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);

    return res.json({
      success: true,
      message: "Account created successfully."
    });

  } catch (error) {
    console.error("❌ Registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Registration failed."
    });
  }
});

// ═══════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required."
      });
    }

    const users = getUsers();

    const normalizedEmail = String(email)
      .trim()
      .toLowerCase();

    const user = users.find(
      user => user.email === normalizedEmail
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    // Regenerate session after successful login
    req.session.regenerate(error => {
      if (error) {
        console.error("❌ Session regeneration error:", error);

        return res.status(500).json({
          success: false,
          message: "Unable to create login session."
        });
      }

      req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email
      };

      req.session.save(saveError => {
        if (saveError) {
          console.error("❌ Session save error:", saveError);

          return res.status(500).json({
            success: false,
            message: "Unable to save login session."
          });
        }

        return res.json({
          success: true,
          message: "Login successful.",
          user: req.session.user
        });
      });
    });

  } catch (error) {
    console.error("❌ Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed."
    });
  }
});

// ═══════════════════════════════════════
// AUTHENTICATION MIDDLEWARE
// ═══════════════════════════════════════

function requireLogin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      message:
        "You must login first. Please login to dashboard with your email/password."
    });
  }

  next();
}

// ═══════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════

app.get("/dashboard", (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect("/login.html");
  }

  res.sendFile(
    path.join(__dirname, "dashboard", "index.html")
  );
});

// Direct dashboard page protection
app.get("/index.html", (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect("/login.html");
  }

  res.sendFile(
    path.join(__dirname, "dashboard", "index.html")
  );
});

// ═══════════════════════════════════════
// CURRENT USER
// ═══════════════════════════════════════

app.get("/api/me", requireLogin, (req, res) => {
  res.json({
    success: true,
    user: req.session.user
  });
});

// ═══════════════════════════════════════
// SESSION STATUS
// ═══════════════════════════════════════

app.get("/api/session", requireLogin, (req, res) => {
  try {
    res.json({
      success: true,
      status: "Logged in",
      user: req.session.user,
      whatsapp: getConnectionStatus()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to read session status."
    });
  }
});

// ═══════════════════════════════════════
// WHATSAPP PAIRING
// ═══════════════════════════════════════

app.post("/api/pair", requireLogin, async (req, res) => {
  try {
    let {
      phoneNumber,
      phone
    } = req.body;

    phoneNumber = phoneNumber || phone;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "WhatsApp number required."
      });
    }

    phoneNumber = String(phoneNumber)
      .replace(/\D/g, "");

    if (phoneNumber.length < 10) {
      return res.status(400).json({
        success: false,
        message:
          "Enter a valid international WhatsApp number."
      });
    }

    console.log(
      `🔗 Pairing request from ${req.session.user.username} - ${phoneNumber}`
    );

    const code = await requestPairingCode(
      phoneNumber,
      "main"
    );

    return res.json({
      success: true,
      message: "Pairing code generated.",
      pairingCode: code,
      code: code
    });

  } catch (error) {
    console.error("❌ Pairing error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to generate pairing code."
    });
  }
});

// ═══════════════════════════════════════
// WHATSAPP STATUS
// ═══════════════════════════════════════

app.get(
  "/api/whatsapp/status",
  requireLogin,
  (req, res) => {
    try {
      res.json({
        success: true,
        whatsapp: getConnectionStatus()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Unable to read WhatsApp status."
      });
    }
  }
);

// ═══════════════════════════════════════
// LOGOUT
// ═══════════════════════════════════════

app.post("/api/logout", requireLogin, (req, res) => {
  req.session.destroy(error => {
    if (error) {
      console.error("❌ Logout error:", error);

      return res.status(500).json({
        success: false,
        message: "Logout failed."
      });
    }

    res.clearCookie("connect.sid");

    return res.json({
      success: true,
      message: "Logged out successfully."
    });
  });
});

// ═══════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════

app.get("/health", (req, res) => {
  let whatsapp = null;

  try {
    whatsapp = getConnectionStatus();
  } catch {
    whatsapp = "unknown";
  }

  res.json({
    status: "online",
    bot: "Queen X",
    uptime: Math.floor(process.uptime()),
    whatsapp,
    timestamp: new Date().toISOString()
  });
});

// ═══════════════════════════════════════
// API 404
// ═══════════════════════════════════════

app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found."
  });
});

// ═══════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════

app.listen(PORT, "0.0.0.0", () => {
  console.log("═══════════════════════════════════════");
  console.log(`👑 QUEEN X running on port ${PORT}`);
  console.log("🔐 Authentication: Email + Password");
  console.log("📱 WhatsApp pairing: Protected");
  console.log("═══════════════════════════════════════");

  setTimeout(() => {
    startWhatsApp("main")
      .then(() => {
        console.log("📱 WhatsApp service started.");
      })
      .catch(error => {
        console.log(
          "⚠️ WhatsApp not connected yet. Pair first."
        );
      });
  }, 5000);
});
