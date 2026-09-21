const fs = require("fs");
const path = require("path");

const USERS_FILE = path.join(__dirname, "users.json");

// Create users.json if it doesn't exist
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, "[]", "utf8");
}

// Get users
function getUsers() {
  try {
    const data = fs.readFileSync(USERS_FILE, "utf8");

    if (!data.trim()) {
      return [];
    }

    const users = JSON.parse(data);

    return Array.isArray(users) ? users : [];
  } catch (error) {
    console.error("❌ users.json error:", error);
    return [];
  }
}

// Save users
function saveUsers(users) {
  fs.writeFileSync(
    USERS_FILE,
    JSON.stringify(users, null, 2),
    "utf8"
  );
}

// Find user by email
function findUser(email) {
  const normalizedEmail =
    String(email || "").trim().toLowerCase();

  return getUsers().find(
    user =>
      String(user.email || "").trim().toLowerCase() ===
      normalizedEmail
  );
}

// Check email
function emailExists(email) {
  return !!findUser(email);
}

// Add user
function addUser(user) {
  const users = getUsers();

  users.push(user);

  saveUsers(users);

  return user;
}

module.exports = {
  getUsers,
  saveUsers,
  findUser,
  emailExists,
  addUser
};
