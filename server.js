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
// DATA
// ═══════════════════════════════════════

const dataDir = path.join(__dirname, "data");
const usersFile = path.join(dataDir, "users.json");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(usersFile)) {
  fs.writeFileSync(usersFile, "[]", "utf8");
}


// ═══════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("trust proxy", 1);

app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      "queen-x-change-this-secret",

    resave: false,

    saveUninitialized: false,

    rolling: true,

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
// USER DATABASE
// ═══════════════════════════════════════

function getUsers() {

  try {

    const data =
      fs.readFileSync(
        usersFile,
        "utf8"
      );

    const users = JSON.parse(data);

    return Array.isArray(users)
      ? users
      : [];

  } catch (error) {

    console.error(
      "❌ USERS FILE ERROR:",
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
// HOME
// ═══════════════════════════════════════

app.get("/", (req, res) => {

  if (req.session.user) {

    return res.redirect(
      "/dashboard"
    );
  }

  res.redirect(
    "/login.html"
  );
});


// ═══════════════════════════════════════
// REGISTER
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
        ).trim()
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


      const users = getUsers();


      const existingUser =
        users.find(
          user =>
            String(user.email)
              .toLowerCase() === email
        );


      if (existingUser) {

        return res.status(409).json({

          success: false,

          message:
            "Email is already registered."

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


      users.push(newUser);

      saveUsers(users);


      console.log(
        "✅ ACCOUNT CREATED:",
        email
      );


      return res.json({

        success: true,

        message:
          "Account created successfully."

      });

    } catch (error) {

      console.error(
        "❌ REGISTER ERROR:",
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
// LOGIN
// ═══════════════════════════════════════

app.post(
  "/api/login",
  async (req, res) => {

    try {

      const email =
        String(
          req.body.email || ""
        ).trim()
        .toLowerCase();

      const password =
        String(
          req.body.password || ""
        );


      console.log(
        "🔐 LOGIN REQUEST:",
        email
      );


      if (!email || !password) {

        return res.status(400).json({

          success: false,

          message:
            "Email and password are required."

        });
      }


      const users =
        getUsers();


      console.log(
        "👥 USERS FOUND:",
        users.length
      );


      const user =
        users.find(
          item =>
            String(item.email)
              .toLowerCase() === email
        );


      if (!user) {

        console.log(
          "❌ USER NOT FOUND:",
          email
        );

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

        console.log(
          "❌ WRONG PASSWORD:",
          email
        );

        return res.status(401).json({

          success: false,

          message:
            "Invalid email or password."

        });
      }


      req.session.regenerate(
        error => {

          if (error) {

            console.error(
              "❌ SESSION ERROR:",
              error
            );

            return res.status(500).json({

              success: false,

              message:
                "Unable to create login session."

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


          req.session.save(
            saveError => {

              if (saveError) {

                console.error(
                  "❌ SESSION SAVE ERROR:",
                  saveError
                );

                return res.status(500).json({

                  success: false,

                  message:
                    "Unable to save login session."

                });
              }


              console.log(
                "✅ LOGIN SUCCESS:",
                email
              );


              return res.json({

                success: true,

                message:
                  "Login successful.",

                user:
                  req.session.user

              });

            }
          );

        }
      );

    } catch (error) {

      console.error(
        "❌ LOGIN ERROR:",
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
// AUTHENTICATION
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
// DASHBOARD
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


// Direct index.html access

app.get(
  "/index.html",
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
// CURRENT USER
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
// SESSION STATUS
// ═══════════════════════════════════════

app.get(
  "/api/session",
  requireLogin,
  (req, res) => {

    let whatsapp =
      "unknown";


    try {

      whatsapp =
        getConnectionStatus();

    } catch (error) {

      whatsapp =
        "unknown";
    }


    res.json({

      success: true,

      status:
        "Logged in",

      user:
        req.session.user,

      whatsapp

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

      let phone =
        req.body.phone ||
        req.body.phoneNumber;


      phone =
        String(
          phone || ""
        )
        .replace(
          /\D/g,
          ""
        );


      if (phone.length < 10) {

        return res.status(400).json({

          success: false,

          message:
            "Enter a valid international WhatsApp number."

        });
      }


      console.log(
        "📱 PAIR REQUEST:",
        phone
      );


      const code =
        await requestPairingCode(
          phone,
          "main"
        );


      return res.json({

        success: true,

        message:
          "Pairing code generated.",

        code,

        pairingCode:
          code

      });

    } catch (error) {

      console.error(
        "❌ PAIRING ERROR:",
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

    try {

      res.json({

        success: true,

        whatsapp:
          getConnectionStatus()

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
// LOGOUT
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


        res.clearCookie(
          "connect.sid"
        );


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
// HEALTH CHECK
// ═══════════════════════════════════════

app.get(
  "/health",
  (req, res) => {

    let whatsapp =
      "unknown";


    try {

      whatsapp =
        getConnectionStatus();

    } catch {}


    res.json({

      status:
        "online",

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
// UNKNOWN API
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
// START SERVER
// ═══════════════════════════════════════

app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      "======================================"
    );

    console.log(
      "👑 QUEEN X SERVER ONLINE"
    );

    console.log(
      `🌐 PORT: ${PORT}`
    );

    console.log(
      "🔐 LOGIN SYSTEM READY"
    );

    console.log(
      "📱 WHATSAPP PAIRING READY"
    );

    console.log(
      "======================================"
    );


    setTimeout(
      () => {

        startWhatsApp("main")
          .then(() => {

            console.log(
              "📱 WhatsApp service started."
            );

          })
          .catch(error => {

            console.log(
              "⚠️ WhatsApp waiting for pairing."
            );

            console.log(
              error.message || ""
            );

          });

      },
      5000
    );

  }
);
