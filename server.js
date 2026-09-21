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

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, "[]", "utf8");
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("trust proxy", 1);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "queen-x-secret-change-this",
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

function getUsers() {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
  } catch (error) {
    console.error("Users read error:", error);
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

// HOME
app.get("/", (req, res) => {
  if (req.session.user) {
    return res.redirect("/dashboard");
  }

  res.sendFile(path.join(__dirname, "dashboard", "login.html"));
});

// REGISTER
app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email and password are required."
      });
    }

    const cleanUsername = String(username).trim();
    const cleanEmail = String(email).trim().toLowerCase();

    if (cleanUsername.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Username must contain at least 2 characters."
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters."
      });
    }

    const users = getUsers();

    if (users.some(user => user.email === cleanEmail)) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = {
      id: Date.now().toString(),
      username: cleanUsername,
      email: cleanEmail,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    users.push(user);
    saveUsers(users);

    console.log(`✅ New account registered: ${cleanEmail}`);

    return res.json({
      success: true,
      message: "Account created successfully."
    });

  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Registration failed."
    });
  }
});

// LOGIN
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required."
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    const users = getUsers();

    const user = users.find(
      item => item.email === cleanEmail
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

    req.session.regenerate(error => {
      if (error) {
        console.error("Session error:", error);

        return res.status(500).json({
          success: false,
          message: "Could not create login session."
        });
      }

      req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email
      };

      req.session.save(saveError => {
        if (saveError) {
          console.error("Session save error:", saveError);

          return res.status(500).json({
            success: false,
            message: "Could not save login session."
          });
        }

        console.log(`🔐 Login successful: ${cleanEmail}`);

        return res.json({
          success: true,
          message: "Login successful.",
          user: req.session.user
        });
      });
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed."
    });
  }
});

// AUTH MIDDLEWARE
function requireLogin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      message: "You must login first. Please login to dashboard with your email/password."
    });
  }

  next();
}

// DASHBOARD
app.get("/dashboard", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login.html");
  }

  res.sendFile(
    path.join(__dirname, "dashboard", "index.html")
  );
});

// Protect direct index.html access
app.get("/index.html", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login.html");
  }

  res.sendFile(
    path.join(__dirname, "dashboard", "index.html")
  );
});

// CURRENT USER
app.get("/api/me", requireLogin, (req, res) => {
  res.json({
    success: true,
    user: req.session.user
  });
});

// SESSION
app.get("/api/session", requireLogin, (req, res) => {
  let whatsapp = "unknown";

  try {
    whatsapp = getConnectionStatus();
  } catch (error) {
    whatsapp = "unknown";
  }

  res.json({
    success: true,
    status: "Logged in",
    user: req.session.user,
    whatsapp
  });
});

// PAIRING
app.post("/api/pair", requireLogin, async (req, res) => {
  try {
    let phoneNumber =
      req.body.phoneNumber ||
      req.body.phone;

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
        message: "Enter a valid international number."
      });
    }

    console.log(
      `🔗 Pairing request from ${req.session.user.email}: ${phoneNumber}`
    );

    const code = await requestPairingCode(
      phoneNumber,
      "main"
    );

    return res.json({
      success: true,
      message: "Pairing code generated.",
      code,
      pairingCode: code
    });

  } catch (error) {
    console.error("Pairing error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to generate pairing code."
    });
  }
});

// WHATSAPP STATUS
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

// LOGOUT
app.post("/api/logout", requireLogin, (req, res) => {
  req.session.destroy(error => {
    if (error) {
      return res.status(500).json({
        success: false,
        message: "Logout failed."
      });
    }

    res.clearCookie("connect.sid");

    res.json({
      success: true,
      message: "Logged out successfully."
    });
  });
});

// HEALTH
app.get("/health", (req, res) => {
  let whatsapp = "unknown";

  try {
    whatsapp = getConnectionStatus();
  } catch {}

  res.json({
    status: "online",
    bot: "Queen X",
    uptime: Math.floor(process.uptime()),
    whatsapp,
    timestamp: new Date().toISOString()
  });
});

// API 404
app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API not found."
  });
});

// START
app.listen(PORT, "0.0.0.0", () => {
  console.log("=======================================");
  console.log(`👑 QUEEN X running on port ${PORT}`);
  console.log("🔐 Email/password authentication enabled");
  console.log("📱 WhatsApp pairing enabled");
  console.log("=======================================");

  setTimeout(() => {
    startWhatsApp("main")
      .then(() => {
        console.log("📱 WhatsApp service started.");
      })
      .catch(() => {
        console.log(
          "⚠️ WhatsApp not connected yet. Pair first."
        );
      });
  }, 5000);
});
