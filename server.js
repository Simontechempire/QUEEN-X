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

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "[]", "utf8");

// MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || "queen-x-change-this",
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: false, sameSite: "lax", maxAge: 24 * 60 * 60 * 1000 }
}));

app.use(express.static(path.join(__dirname, "dashboard")));

// USERS
function getUsers() {
  try { return JSON.parse(fs.readFileSync(USERS_FILE, "utf8")); } catch { return []; }
}
function saveUsers(users) { fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8"); }

// HOME
app.get("/", (req, res) => {
  if (req.session.user) return res.redirect("/dashboard");
  res.sendFile(path.join(__dirname, "dashboard", "login.html"));
});

// REGISTER
app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ success: false, message: "All fields required." });
    if (password.length < 6) return res.status(400).json({ success: false, message: "Password min 6 chars." });
    const users = getUsers();
    const normalizedEmail = email.trim().toLowerCase();
    if (users.find(u => u.email === normalizedEmail)) return res.status(409).json({ success: false, message: "Email exists." });
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = { id: Date.now().toString(), username: username.trim(), email: normalizedEmail, password: hashedPassword, createdAt: new Date().toISOString() };
    users.push(newUser); saveUsers(users);
    return res.json({ success: true, message: "Account created." });
  } catch (error) { return res.status(500).json({ success: false, message: "Registration failed." }); }
});

// LOGIN
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Email and password required." });
    const users = getUsers();
    const normalizedEmail = email.trim().toLowerCase();
    const user = users.find(u => u.email === normalizedEmail);
    if (!user) return res.status(401).json({ success: false, message: "Invalid email or password." });
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ success: false, message: "Invalid email or password." });
    req.session.user = { id: user.id, username: user.username, email: user.email };
    return res.json({ success: true, message: "Login successful." });
  } catch (error) { return res.status(500).json({ success: false, message: "Login failed." }); }
});

// AUTH
function requireLogin(req, res, next) {
  if (!req.session.user) return res.status(401).json({ success: false, message: "You must login first. Please login to dashboard with your email/password." });
  next();
}

// DASHBOARD
app.get("/dashboard", (req, res) => {
  if (!req.session.user) return res.redirect("/login.html");
  res.sendFile(path.join(__dirname, "dashboard", "index.html"));
});

app.get("/api/me", requireLogin, (req, res) => { res.json({ success: true, user: req.session.user }); });

// ===== FIXED PAIRING - NOW REQUIRES LOGIN BUT WORKS =====
app.post("/api/pair", requireLogin, async (req, res) => {
  try {
    let { phoneNumber, phone } = req.body;
    phoneNumber = phoneNumber || phone; // support both keys
    if (!phoneNumber) return res.status(400).json({ success: false, message: "WhatsApp number required." });
    phoneNumber = String(phoneNumber).replace(/\D/g, "");
    if (phoneNumber.length < 10) return res.status(400).json({ success: false, message: "Enter valid international number." });

    console.log(`🔗 Pairing request from ${req.session.user.username} - ${phoneNumber}`);

    const code = await requestPairingCode(phoneNumber, "main");
    
    return res.json({ success: true, message: "Pairing code generated.", pairingCode: code, code: code });
  } catch (error) {
    console.error("❌ Pairing error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to generate code. Delete auth folder and retry." });
  }
});

app.get("/api/whatsapp/status", requireLogin, (req, res) => {
  try { res.json({ success: true, whatsapp: getConnectionStatus() }); }
  catch { res.status(500).json({ success: false, message: "Unable to read status." }); }
});

app.post("/api/logout", requireLogin, (req, res) => {
  req.session.destroy(error => {
    if (error) return res.status(500).json({ success: false, message: "Logout failed." });
    res.json({ success: true, message: "Logged out." });
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "online", bot: "Queen X", uptime: Math.floor(process.uptime()), whatsapp: getConnectionStatus(), timestamp: new Date().toISOString() });
});

app.use("/api", (req, res) => { res.status(404).json({ success: false, message: "API not found." }); });

app.listen(PORT, "0.0.0.0", () => {
  console.log(`QUEEN X running on ${PORT}`);
  // DON'T AUTO START WHATSAPP HERE - IT BLOCKS PAIRING
  // startWhatsApp("main") will start when you pair or you can uncomment if you want
  // But for pairing to work first time, we delay it
  setTimeout(() => {
    startWhatsApp("main").catch(e => console.log("WhatsApp not connected yet, pair first"));
  }, 5000);
});
