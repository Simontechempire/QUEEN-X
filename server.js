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

const PORT = Number(process.env.PORT) || 3000;


// ═══════════════════════════════════════
// 📁 PATHS
// ═══════════════════════════════════════

const DATA_DIR = path.join(
  __dirname,
  "data"
);

const USERS_FILE = path.join(
  DATA_DIR,
  "users.json"
);

const DASHBOARD_DIR = path.join(
  __dirname,
  "dashboard"
);


// ═══════════════════════════════════════
// 📁 CREATE DATA DIRECTORY
// ═══════════════════════════════════════

if (!fs.existsSync(DATA_DIR)) {

  fs.mkdirSync(DATA_DIR, {
    recursive: true
  });

}


// ═══════════════════════════════════════
// 👤 CREATE USERS FILE
// ═══════════════════════════════════════

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

app.use(
  express.json()
);

app.use(
  express.urlencoded({
    extended: true
  })
);

app.set(
  "trust proxy",
  1
);


// ═══════════════════════════════════════
// 🔐 SESSION
// ═══════════════════════════════════════

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
    DASHBOARD_DIR
  )
);


// ═══════════════════════════════════════
// 👤 READ USERS
// ═══════════════════════════════════════

function getUsers() {

  try {

    if (!fs.existsSync(USERS_FILE)) {

      return [];

    }

    const raw =
      fs.readFileSync(
        USERS_FILE,
        "utf8"
      );

    if (!raw.trim()) {

      return [];

    }

    const users =
      JSON.parse(raw);

    if (!Array.isArray(users)) {

      return [];

    }

    return users;

  } catch (error) {

    console.error(
      "❌ Failed to read users.json:",
      error.message
    );

    return [];

  }

}


// ═══════════════════════════════════════
// 💾 SAVE USERS
// ═══════════════════════════════════════

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

app.get(
  "/",
  (req, res) => {

    if (req.session.user) {

      return res.redirect(
        "/dashboard"
      );

    }

    return res.sendFile(
      path.join(
        DASHBOARD_DIR,
        "login.html"
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

      const email =
        String(
          req.body.email || ""
        )
        .trim()
        .toLowerCase();

      const password =
        String(
          req.body.password || ""
        );


      if (
        !username ||
        !email ||
        !password
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Username, email and password are required."

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
        getUsers();


      const existing =
        users.find(
          user =>
            String(
              user.email || ""
            )
            .trim()
            .toLowerCase() === email
        );


      if (existing) {

        return res.status(409).json({

          success: false,

          message:
            "Email already registered. Please login."

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

        username,

        email,

        password:
          hashedPassword,

        createdAt:
          new Date().toISOString()

      };


      users.push(user);

      saveUsers(users);


      console.log(
        `✅ User registered: ${email}`
      );


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

      const email =
        String(
          req.body.email || ""
        )
        .trim()
        .toLowerCase();

      const password =
        String(
          req.body.password || ""
        );


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


      const users =
        getUsers();


      const user =
        users.find(
          item =>
            String(
              item.email || ""
            )
            .trim()
            .toLowerCase() === email
        );


      if (!user) {

        console.log(
          `❌ Login failed: ${email}`
        );

        return res.status(401).json({

          success: false,

          message:
            "Invalid email or password."

        });

      }


      /*
       * Supports bcrypt passwords created
       * by the register system.
       */

      const valid =
        await bcrypt.compare(
          password,
          String(
            user.password || ""
          )
        );


      if (!valid) {

        console.log(
          `❌ Wrong password: ${email}`
        );

        return res.status(401).json({

          success: false,

          message:
            "Invalid email or password."

        });

      }


      req.session.user = {

        id:
          user.id,

        username:
          user.username,

        email:
          user.email

      };


      console.log(
        `✅ Login successful: ${email}`
      );


      return res.json({

        success: true,

        message:
          "Login successful.",

        user:
          req.session.user

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
// 🔒 REQUIRE LOGIN
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

    return res.sendFile(
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
  requireLogin,
  (req, res) => {

    return res.json({

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

      let phone =
        req.body.phone ||
        req.body.phoneNumber ||
        "";


      phone =
        String(phone)
          .replace(/\D/g, "");


      if (!phone) {

        return res.status(400).json({

          success: false,

          message:
            "WhatsApp number is required."

        });

      }


      if (phone.length < 10) {

        return res.status(400).json({

          success: false,

          message:
            "Enter a valid international WhatsApp number."

        });

      }


      console.log("");
      console.log(
        "══════════════════════════════════════"
      );
      console.log(
        "🔗 QUEEN X PAIR REQUEST"
      );
      console.log(
        `👤 User: ${req.session.user.email}`
      );
      console.log(
        `📱 Number: ${phone}`
      );
      console.log(
        "══════════════════════════════════════"
      );


      /*
       * IMPORTANT:
       *
       * This matches your OLD connection.js:
       *
       * requestPairingCode(
       *   phoneNumber,
       *   sessionId
       * )
       *
       * We intentionally use "main"
       * because your old connection.js
       * expects this session.
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


      console.log(
        `🔑 Pairing code: ${code}`
      );


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
// 📡 WHATSAPP STATUS
// ═══════════════════════════════════════

app.get(
  "/api/whatsapp/status",
  requireLogin,
  (req, res) => {

    try {

      return res.json({

        success: true,

        whatsapp:
          getConnectionStatus()

      });

    } catch (error) {

      console.error(
        "❌ WhatsApp status error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to read WhatsApp status."

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

      return res.json({

        success: true,

        user:
          req.session.user,

        whatsapp:
          getConnectionStatus()

      });

    } catch (error) {

      console.error(
        "❌ Session status error:",
        error
      );

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

    let whatsapp;

    try {

      whatsapp =
        getConnectionStatus();

    } catch {

      whatsapp = {
        status: "unknown",
        connected: false
      };

    }


    return res.json({

      status: "online",

      bot:
        "Queen X",

      uptime:
        Math.floor(
          process.uptime()
        ),

      whatsapp,

      timestamp:
        new Date().toISOString()

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
      "║          👑 QUEEN X                  ║"
    );

    console.log(
      "╠══════════════════════════════════════╣"
    );

    console.log(
      `║  🟢 Server running on port ${PORT}`
    );

    console.log(
      "║  🌐 Dashboard ready                  ║"
    );

    console.log(
      "╚══════════════════════════════════════╝"
    );

    console.log("");

    /*
     * IMPORTANT:
     *
     * We DO NOT automatically call
     * startWhatsApp("main") here.
     *
     * The old connection.js will start
     * WhatsApp when /api/pair is called.
     */

  }
);
