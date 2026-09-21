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
// 📁 DIRECTORIES
// ═══════════════════════════════════════

const DATA_DIR = path.join(__dirname, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const DASHBOARD_DIR = path.join(__dirname, "dashboard");

if (!fs.existsSync(DATA_DIR)) {
fs.mkdirSync(DATA_DIR, {
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

app.set("trust proxy", 1);

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
express.static(DASHBOARD_DIR)
);

// ═══════════════════════════════════════
// 👤 USERS
// ═══════════════════════════════════════

function getUsers() {

try {

if (!fs.existsSync(USERS_FILE)) {  
  return [];  
}  

const data =  
  fs.readFileSync(  
    USERS_FILE,  
    "utf8"  
  );  

if (!data.trim()) {  
  return [];  
}  

const users =  
  JSON.parse(data);  

return Array.isArray(users)  
  ? users  
  : [];

} catch (error) {

console.error(  
  "❌ Users file error:",  
  error.message  
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

return res.sendFile(
path.join(
DASHBOARD_DIR,
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


  const users =  
    getUsers();  


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
        "Email already registered. Please login."  
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
    `👤 New user registered: ${email}`  
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
    ).trim()  
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
        String(item.email)  
          .trim()  
          .toLowerCase() === email  
    );  


  if (!user) {  

    console.log(  
      `❌ Login failed: user not found - ${email}`  
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
      `❌ Login failed: wrong password - ${email}`  
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
// 🔒 LOGIN CHECK
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

  let phone =  
    req.body.phone ||  
    req.body.phoneNumber;  


  phone =  
    String(  
      phone || ""  
    )  
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


  console.log(  
    `🔗 Pair request from ${req.session.user.email}: ${phone}`  
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
// ❤️ HEALTH
// ═══════════════════════════════════════

app.get(
"/health",
(req, res) => {

res.json({  

  status: "online",  

  bot: "Queen X",  

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
  `║  🟢 Server running on port ${PORT}       ║`  
);  
console.log(  
  "║  🌐 Dashboard ready                  ║"  
);  
console.log(  
  "╚══════════════════════════════════════╝"  
);  
console.log("");  

/*  
 * Start WhatsApp in the background.  
 * A pairing request can also start it  
 * when needed.  
 */  

setTimeout(() => {  

  startWhatsApp("main")  
    .then(() => {  

      console.log(  
        "📡 WhatsApp service started."  
      );  

    })  
    .catch(error => {  

      console.log(  
        "⚠️ WhatsApp not connected yet."  
      );  

      console.log(  
        error.message  
      );  

    });  

}, 3000);

}
);
