const fs = require("fs");
const path = require("path");

const COMMANDS_DIR = path.join(
  __dirname,
  "..",
  "commands"
);

function loadCommands() {
  const commands = new Map();

  if (!fs.existsSync(COMMANDS_DIR)) {
    return commands;
  }

  const categories = fs.readdirSync(
    COMMANDS_DIR,
    { withFileTypes: true }
  );

  for (const category of categories) {
    if (!category.isDirectory()) {
      continue;
    }

    const categoryPath = path.join(
      COMMANDS_DIR,
      category.name
    );

    const files = fs.readdirSync(
      categoryPath
    );

    for (const file of files) {
      if (
        !file.endsWith(".js") ||
        file === "index.js"
      ) {
        continue;
      }

      try {
        const commandPath = path.join(
          categoryPath,
          file
        );

        delete require.cache[
          require.resolve(commandPath)
        ];

        const command = require(
          commandPath
        );

        if (!command.name) {
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

      } catch (error) {
        console.error(
          `Failed to load ${category.name}/${file}:`,
          error.message
        );
      }
    }
  }

  return commands;
}

module.exports = {
  loadCommands
};
