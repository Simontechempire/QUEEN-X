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
const usersFile = path.join(dataDir, "users.json");

fs.mkdirSync(dataDir, { recursive: true });

if (!fs.existsSync(usersFile)) {
  fs.writeFileSync(usersFile, "[]");
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "queen-x-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000
    }
  })
);

app.use(express.static(path.join(__dirname, "dashboard")));

function getUsers() {
  try {
    return JSON.parse(fs.readFileSync(usersFile, "utf8"));
  } catch {
    return [];
  }
}

function saveUsers(users) {
  fs.writeFileSync(
    usersFile,
    JSON.stringify(users, null, 2)
  );
}


// =============================
// HOME
// =============================

app.get("/", (req, res) => {
  if (req.session.user) {
    return res.redirect("/dashboard");
  }

  res.redirect("/login.html");
});


// =============================
// REGISTER
// =============================

app.post("/api/register", async (req, res) => {
  try {

    const username = String(req.body.username || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required."
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters."
      });
    }

    const users = getUsers();

    const exists = users.find(
      user => user.email.toLowerCase() === email
    );

    if (exists) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: Date.now().toString(),
      username,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);

    saveUsers(users);

    console.log("✅ USER REGISTERED:", email);

    return res.json({
      success: true,
      message: "Account created successfully."
    });

  } catch (error) {

    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Registration failed."
    });
  }
});


// =============================
// LOGIN
// =============================

app.post("/api/login", async (req, res) => {

  try {

    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();

    const password = String(req.body.password || "");

    console.log("LOGIN REQUEST:", email);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required."
      });
    }

    const users = getUsers();

    console.log("USERS FOUND:", users.length);

    const user = users.find(
      item => item.email.toLowerCase() === email
    );

    if (!user) {

      console.log("❌ USER NOT FOUND:", email);

      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    const passwordCorrect =
      await bcrypt.compare(password, user.password);

    if (!passwordCorrect) {

      console.log("❌ WRONG PASSWORD:", email);

      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email
    };

    req.session.save(error => {

      if (error) {

        console.error("SESSION ERROR:", error);

        return res.status(500).json({
          success: false,
          message: "Login session could not be created."
        });
      }

      console.log("✅ LOGIN SUCCESS:", email);

      res.json({
        success: true,
        message: "Login successful."
      });

    });

  } catch (error) {

    console.error("LOGIN ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Login failed."
    });
  }
});


// =============================
// AUTH
// =============================

function requireLogin(req, res, next) {

  if (!req.session.user) {

    return res.status(401).json({
      success: false,
      message: "You must login first."
    });
  }

  next();
}


// =============================
// DASHBOARD
// =============================

app.get("/dashboard", (req, res) => {

  if (!req.session.user) {
    return res.redirect("/login.html");
  }

  res.sendFile(
    path.join(__dirname, "dashboard", "index.html")
  );
});


// =============================
// CURRENT USER
// =============================

app.get("/api/me", requireLogin, (req, res) => {

  res.json({
    success: true,
    user: req.session.user
  });
});


// =============================
// PAIR WHATSAPP
// =============================

app.post("/api/pair", requireLogin, async (req, res) => {

  try {

    let phone =
      req.body.phone ||
      req.body.phoneNumber;

    phone = String(phone || "")
      .replace(/\D/g, "");

    if (phone.length < 10) {

      return res.status(400).json({
        success: false,
        message: "Enter a valid WhatsApp number."
      });
    }

    const code =
      await requestPairingCode(phone, "main");

    res.json({
      success: true,
      code,
      pairingCode: code
    });

  } catch (error) {

    console.error("PAIR ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Pairing failed."
    });
  }
});


// =============================
// SESSION STATUS
// =============================

app.get("/api/session", requireLogin, (req, res) => {

  let whatsapp = "unknown";

  try {
    whatsapp = getConnectionStatus();
  } catch {}

  res.json({
    success: true,
    user: req.session.user,
    whatsapp
  });
});


// =============================
// LOGOUT
// =============================

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
      message: "Logged out."
    });
  });
});


// =============================
// HEALTH
// =============================

app.get("/health", (req, res) => {

  res.json({
    status: "online",
    bot: "Queen X",
    uptime: Math.floor(process.uptime())
  });
});


// =============================
// START
// =============================

app.listen(PORT, "0.0.0.0", () => {

  console.log("================================");
  console.log("👑 QUEEN X SERVER ONLINE");
  console.log("🌐 PORT:", PORT);
  console.log("🔐 AUTH SYSTEM READY");
  console.log("================================");

  setTimeout(() => {

    startWhatsApp("main")
      .then(() => console.log("📱 WhatsApp started"))
      .catch(() =>
        console.log("⚠️ WhatsApp waiting for pairing")
      );

  }, 5000);

});
