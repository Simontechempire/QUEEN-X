const fs = require("fs");
const path = require("path");

const AUTH_DIR = path.join(
  __dirname,
  "..",
  "sessions"
);

function ensureAuthDirectory() {
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, {
      recursive: true
    });
  }
}

function getAuthPath(sessionId) {
  ensureAuthDirectory();

  return path.join(
    AUTH_DIR,
    String(sessionId)
  );
}

function authExists(sessionId) {
  return fs.existsSync(
    getAuthPath(sessionId)
  );
}

module.exports = {
  ensureAuthDirectory,
  getAuthPath,
  authExists
};
