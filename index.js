require("dotenv").config();

const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Qᴜᴇᴇɴ X</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="
        background:#080808;
        color:white;
        font-family:Arial;
        text-align:center;
        padding:80px 20px;
      ">
        <h1>Qᴜᴇᴇɴ X</h1>
        <p>WhatsApp MD Dashboard</p>
        <p>Server Online</p>
      </body>
    </html>
  `);
});

app.get("/health", (req, res) => {
  res.json({
    status: "online",
    bot: "Qᴜᴇᴇɴ X"
  });
});

app.listen(PORT, () => {
  console.log(`Qᴜᴇᴇɴ X running on port ${PORT}`);
});
