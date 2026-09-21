const fs = require("fs");
const path = require("path");

const DATA_DIR = __dirname;
const USERS_FILE = path.join(DATA_DIR, "users.json");

// Make sure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, {
    recursive: true
  });
}

// Make sure users.json exists
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(
    USERS_FILE,
    "[]",
    "utf8"
  );
}


// ═══════════════════════════════════════
// 👤 GET USERS
// ═══════════════════════════════════════

function getUsers() {
  try {
    const data = fs.readFileSync(
      USERS_FILE,
      "utf8"
    );

    if (!data.trim()) {
      return [];
    }

    const users = JSON.parse(data);

    return Array.isArray(users)
      ? users
      : [];

  } catch (error) {

    console.error(
      "❌ Failed to read users:",
      error.message
    );

    return [];
  }
}


// ═══════════════════════════════════════
// 💾 SAVE USERS
// ═══════════════════════════════════════

function saveUsers(users) {

  if (!Array.isArray(users)) {
    throw new Error(
      "Users must be an array."
    );
  }

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
// 🔎 FIND USER BY EMAIL
// ═══════════════════════════════════════

function findUserByEmail(email) {

  if (!email) {
    return null;
  }

  const normalizedEmail =
    String(email)
      .trim()
      .toLowerCase();

  const users = getUsers();

  return users.find(
    user =>
      String(user.email)
        .trim()
        .toLowerCase() === normalizedEmail
  ) || null;
}


// ═══════════════════════════════════════
// 🔎 FIND USER BY ID
// ═══════════════════════════════════════

function findUserById(id) {

  const users = getUsers();

  return users.find(
    user => String(user.id) === String(id)
  ) || null;
}


// ═══════════════════════════════════════
// ➕ ADD USER
// ═══════════════════════════════════════

function addUser(user) {

  const users = getUsers();

  users.push(user);

  saveUsers(users);

  return user;
}


// ═══════════════════════════════════════
// 📊 USER COUNT
// ═══════════════════════════════════════

function getUserCount() {
  return getUsers().length;
}


// ═══════════════════════════════════════
// 📤 EXPORT
// ═══════════════════════════════════════

module.exports = {
  getUsers,
  saveUsers,
  findUserByEmail,
  findUserById,
  addUser,
  getUserCount,
  USERS_FILE
};
