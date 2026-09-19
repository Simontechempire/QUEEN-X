require("dotenv").config();

const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTML dashboard
app.use(express.static(path.join(__dirname, "dashboard")));

// Home
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "dashboard", "index.html"));
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
