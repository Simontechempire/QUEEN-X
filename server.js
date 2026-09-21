require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcryptjs");

const {
  getUsers,
  findUser,
  emailExists,
  addUser
} = require("./data/user");

const {
  startWhatsApp,
  requestPairingCode,
  getConnectionStatus
} = require("./lib/connection");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      "queen-x-super-secret-change-this",

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

app.use(
  express.static(
    path.join(__dirname, "dashboard")
  )
);


// ═══════════════════════════════════════
// HOME
// ═══════════════════════════════════════

app.get("/", (req, res) => {

  if (req.session.user) {
    return res.redirect("/dashboard");
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
// REGISTER
// ═══════════════════════════════════════

app.post("/api/register", async (req, res) => {

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
        message: "All fields are required."
      });

    }

    if (password.length < 6) {

      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters."
      });

    }

    const cleanUsername =
      String(username).trim();

    const cleanEmail =
      String(email)
        .trim()
        .toLowerCase();

    if (
      !cleanUsername ||
      !cleanEmail
    ) {

      return res.status(400).json({
        success: false,
        message: "Invalid username or email."
      });

    }

    if (emailExists(cleanEmail)) {

      return res.status(409).json({
        success: false,
        message: "Email already registered."
      });

    }

    const hashedPassword =
      await bcrypt.hash(
        password,
        12
      );

    const user = {

      id:
        Date.now().toString(),

      username:
        cleanUsername,

      email:
        cleanEmail,

      password:
        hashedPassword,

      createdAt:
        new Date().toISOString()

    };

    addUser(user);

    console.log(
      `✅ New user registered: ${cleanEmail}`
    );

    return res.json({
      success: true,
      message: "Account created successfully."
    });

  } catch (error) {

    console.error(
      "❌ Registration error:",
      error
    );

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

    const {
      email,
      password
    } = req.body;

    if (
      !email ||
      !password
    ) {

      return res.status(400).json({
        success: false,
        message:
          "Email and password are required."
      });

    }

    const cleanEmail =
      String(email)
        .trim()
        .toLowerCase();

    const user =
      findUser(cleanEmail);

    if (!user) {

      console.log(
        `❌ Login failed: user not found ${cleanEmail}`
      );

      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password."
      });

    }

    if (!user.password) {

      return res.status(401).json({
        success: false,
        message:
          "This account has no valid password. Please register again."
      });

    }

    const passwordValid =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordValid) {

      console.log(
        `❌ Wrong password: ${cleanEmail}`
      );

      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password."
      });

    }

    req.session.user = {

      id: user.id,

      username: user.username,

      email: user.email

    };

    console.log(
      `✅ Login successful: ${cleanEmail}`
    );

    return res.json({
      success: true,
      message: "Login successful."
    });

  } catch (error) {

    console.error(
      "❌ Login error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Login failed."
    });

  }

});


// ═══════════════════════════════════════
// AUTH MIDDLEWARE
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
// DASHBOARD
// ═══════════════════════════════════════

app.get("/dashboard", (req, res) => {

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

});


// ═══════════════════════════════════════
// CURRENT USER
// ═══════════════════════════════════════

app.get(
  "/api/me",
  requireLogin,
  (req, res) => {

    res.json({
      success: true,
      user: req.session.user
    });

  }
);


// ═══════════════════════════════════════
// WHATSAPP PAIRING
// ═══════════════════════════════════════

app.post(
  "/api/pair",
  requireLogin,
  async (req, res) => {

    try {

      const phone =
        req.body.phone ||
        req.body.phoneNumber;

      if (!phone) {

        return res.status(400).json({
          success: false,
          message:
            "WhatsApp number is required."
        });

      }

      const number =
        String(phone)
          .replace(/\D/g, "");

      if (number.length < 10) {

        return res.status(400).json({
          success: false,
          message:
            "Enter a valid international number."
        });

      }

      console.log(
        `🔗 Pair request by ${req.session.user.email}: ${number}`
      );

      const code =
        await requestPairingCode(
          number,
          "main"
        );

      return res.json({

        success: true,

        message:
          "Pairing code generated.",

        code: code,

        pairingCode: code

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
          "Failed to generate pairing code."

      });

    }

  }
);


// ═══════════════════════════════════════
// WHATSAPP STATUS
// ═══════════════════════════════════════

app.get(
  "/api/whatsapp/status",
  requireLogin,
  (req, res) => {

    res.json({
      success: true,
      whatsapp:
        getConnectionStatus()
    });

  }
);


// Dashboard session endpoint
app.get(
  "/api/session",
  requireLogin,
  (req, res) => {

    res.json({

      success: true,

      user:
        req.session.user,

      whatsapp:
        getConnectionStatus()

    });

  }
);


// ═══════════════════════════════════════
// LOGOUT DASHBOARD
// ═══════════════════════════════════════

app.post(
  "/api/logout",
  requireLogin,
  (req, res) => {

    req.session.destroy(
      error => {

        if (error) {

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
// HEALTH
// ═══════════════════════════════════════

app.get("/health", (req, res) => {

  res.json({

    status: "online",

    bot: "Queen X",

    uptime:
      Math.floor(
        process.uptime()
      ),

    whatsapp:
      getConnectionStatus(),

    time:
      new Date().toISOString()

  });

});


module.exports = app;
