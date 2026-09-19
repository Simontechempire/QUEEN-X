const fs = require("fs");
const path = require("path");

const SESSIONS_DIR = path.join(
  __dirname,
  "..",
  "sessions"
);

function ensureSessionsDirectory() {
  if (!fs.existsSync(SESSIONS_DIR)) {
    fs.mkdirSync(SESSIONS_DIR, {
      recursive: true
    });
  }
}

function getSessionPath(sessionId) {
  ensureSessionsDirectory();

  return path.join(
    SESSIONS_DIR,
    String(sessionId)
  );
}

function sessionExists(sessionId) {
  return fs.existsSync(
    getSessionPath(sessionId)
  );
}

function deleteSession(sessionId) {
  const sessionPath =
    getSessionPath(sessionId);

  if (fs.existsSync(sessionPath)) {
    fs.rmSync(sessionPath, {
      recursive: true,
      force: true
    });

    return true;
  }

  return false;
}

function listSessions() {
  ensureSessionsDirectory();

  return fs.readdirSync(SESSIONS_DIR);
}

module.exports = {
  ensureSessionsDirectory,
  getSessionPath,
  sessionExists,
  deleteSession,
  listSessions
};
