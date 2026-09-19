require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const session = require("express-session");

const app = express();
const PORT = process.env.PORT || 3000;

const USERS_FILE = path.join(__dirname, "data", "users.json");

// Make sure data folder exists
const dataDir = path.join(__dirname, "data");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, "[]");
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "queen-x-change-this",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 24 * 60 * 60 * 1000
    }
  })
);

// Static files
app.use(express.static(path.join(__dirname, "dashboard")));

// Read users
function getUsers() {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
  } catch {
    return [];
  }
}

// Save users
function saveUsers(users) {
  fs.writeFileSync(
    USERS_FILE,
    JSON.stringify(users, null, 2)
  );
}

// Home = Login
app.get("/", (req, res) => {
  if (req.session.user) {
    return res.redirect("/dashboard");
  }

  res.sendFile(
    path.join(__dirname, "dashboard", "login.html")
  );
});

// Register
app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required."
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters."
      });
    }

    const users = getUsers();

    const existingUser = users.find(
      user => user.email.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = {
      id: Date.now().toString(),
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);

    res.json({
      success: true,
      message: "Account created successfully."
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Registration failed."
    });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const users = getUsers();

    const user = users.find(
      user => user.email === email.toLowerCase()
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

    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email
    };

    res.json({
      success: true,
      message: "Login successful."
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Login failed."
    });
  }
});

// Authentication middleware
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login.html");
  }

  next();
}

// Protected dashboard
app.get("/dashboard", requireLogin, (req, res) => {
  res.sendFile(
    path.join(__dirname, "dashboard", "index.html")
  );
});

// Current user
app.get("/api/me", requireLogin, (req, res) => {
  res.json({
    success: true,
    user: req.session.user
  });
});

// Logout
app.post("/api/logout", requireLogin, (req, res) => {
  req.session.destroy(() => {
    res.json({
      success: true,
      message: "Logged out successfully."
    });
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "online",
    bot: "Qᴜᴇᴇɴ X"
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Qᴜᴇᴇɴ X running on port ${PORT}`);
});
