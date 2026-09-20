const fs = require("fs");
const path = require("path");

const commands = new Map();

function loadCommands() {
  const commandsDir = path.join(
    __dirname,
    "..",
    "commands"
  );

  if (!fs.existsSync(commandsDir)) {
    console.warn("⚠️ commands folder not found.");
    return commands;
  }

  const files = fs
    .readdirSync(commandsDir)
    .filter(file => file.endsWith(".js"));

  for (const file of files) {
    try {
      const filePath = path.join(
        commandsDir,
        file
      );

      delete require.cache[
        require.resolve(filePath)
      ];

      const command = require(filePath);

      if (!command || !command.name) {
        console.warn(
          `⚠️ Skipping ${file}: missing command name.`
        );
        continue;
      }

      commands.set(
        command.name.toLowerCase(),
        command
      );

      if (Array.isArray(command.aliases)) {
        for (const alias of command.aliases) {
          commands.set(
            alias.toLowerCase(),
            command
          );
        }
      }

      if (Array.isArray(command.commands)) {
        for (const cmd of command.commands) {
          commands.set(
            cmd.toLowerCase(),
            command
          );
        }
      }

      console.log(
        `✅ Loaded command: ${command.name}`
      );

    } catch (error) {
      console.error(
        `❌ Failed to load ${file}:`,
        error.message
      );
    }
  }

  console.log(
    `📦 Total command entries: ${commands.size}`
  );

  return commands;
}

function getCommand(name) {
  if (!name) return null;

  return commands.get(
    name.toLowerCase()
  ) || null;
}

function reloadCommands() {
  commands.clear();
  loadCommands();

  return commands;
}

module.exports = {
  commands,
  loadCommands,
  getCommand,
  reloadCommands
};
