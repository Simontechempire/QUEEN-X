
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
const usersFile = path.join(dataDir, "users.json");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, {
    recursive: true
  });
}

if (!fs.existsSync(usersFile)) {
  fs.writeFileSync(
    usersFile,
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
      "queen-x-session-secret-change-this",

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


// ═══════════════════════════════════════
// 🌐 STATIC DASHBOARD
// ═══════════════════════════════════════

app.use(
  express.static(
    path.join(__dirname, "dashboard")
  )
);


// ═══════════════════════════════════════
// 👤 USERS
// ═══════════════════════════════════════

function getUsers() {

  try {

    const data =
      fs.readFileSync(
        usersFile,
        "utf8"
      );

    const users =
      JSON.parse(data);

    return Array.isArray(users)
      ? users
      : [];

  } catch (error) {

    console.error(
      "❌ Failed to read users.json:",
      error
    );

    return [];
  }
}


function saveUsers(users) {

  fs.writeFileSync(
    usersFile,
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
            "Password must contain at least 6 characters."
        });
      }


      const users =
        getUsers();


      const existingUser =
        users.find(
          user =>
            String(user.email)
              .trim()
              .toLowerCase() === email
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

        username,

        email,

        password:
          hashedPassword,

        createdAt:
          new Date().toISOString()
      };


      users.push(
        newUser
      );

      saveUsers(
        users
      );


      console.log(
        `✅ New account registered: ${email}`
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


      console.log(
        `🔐 Login attempt: ${email}`
      );


      const user =
        users.find(
          item =>
            String(item.email)
              .trim()
              .toLowerCase() === email
        );


      if (!user) {

        console.log(
          `❌ Login email not found: ${email}`
        );

        return res.status(401).json({

          success: false,

          message:
            "Invalid email or password."
        });
      }


      if (!user.password) {

        console.log(
          `❌ Account has no password hash: ${email}`
        );

        return res.status(401).json({

          success: false,

          message:
            "Account password data is missing. Please register again."
        });
      }


      const passwordMatches =
        await bcrypt.compare(
          password,
          user.password
        );


      if (!passwordMatches) {

        console.log(
          `❌ Incorrect password: ${email}`
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
// 🔒 AUTH MIDDLEWARE
// ═══════════════════════════════════════

function requireLogin(
  req,
  res,
  next
) {

  if (
    !req.session ||
    !req.session.user
  ) {

    return res.status(401).json({

      success: false,

      message:
        "You must login first. Please login to dashboard with your email/password."
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

    if (
      !req.session ||
      !req.session.user
    ) {

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
// 🔗 WHATSAPP PAIR
// ═══════════════════════════════════════

app.post(
  "/api/pair",
  requireLogin,
  async (req, res) => {

    try {

      let phoneNumber =
        req.body.phoneNumber ||
        req.body.phone;


      phoneNumber =
        String(
          phoneNumber || ""
        )
          .replace(/\D/g, "");


      if (
        phoneNumber.length < 10
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Enter a valid international WhatsApp number."
        });
      }


      console.log(
        `🔗 Pairing request from ${req.session.user.email}`
      );


      const code =
        await requestPairingCode(
          phoneNumber,
          "main"
        );


      return res.json({

        success: true,

        message:
          "Pairing code generated.",

        pairingCode:
          code,

        code:
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

      return res.status(500).json({

        success: false,

        message:
          "Unable to read session."
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
// ❤️ HEALTH
// ═══════════════════════════════════════

app.get(
  "/health",
  (req, res) => {

    res.json({

      status:
        "online",

      bot:
        "Queen X",

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
// ❌ UNKNOWN API
// ═══════════════════════════════════════

app.use(
  "/api",
  (req, res) => {

    res.status(404).json({

      success: false,

      message:
        "API not found."
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

    console.log(
      `👑 QUEEN X running on port ${PORT}`
    );

    console.log(
      "🔐 Authentication system ready."
    );

    console.log(
      "📱 WhatsApp pairing starts when requested."
    );
  }
);
