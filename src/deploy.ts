import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import { readdirSync } from 'fs';
import { join } from 'path';

config();

const commands = [];
const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js') || file.endsWith('.ts'));

// Load commands
for (const file of commandFiles) {
  const filePath = join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
    console.log(`[INFO] Loaded command: ${command.data.name}`);
  } else {
    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
  }
}

// Deploy commands
const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    // Deploy to guild (faster for development)
    if (process.env.GUILD_ID) {
      const data = await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID),
        { body: commands },
      ) as any[];

      console.log(`Successfully reloaded ${data.length} application (/) commands for guild.`);
    } else {
      // Deploy globally (takes up to 1 hour to propagate)
      const data = await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID!),
        { body: commands },
      ) as any[];

      console.log(`Successfully reloaded ${data.length} application (/) commands globally.`);
    }
  } catch (error) {
    console.error(error);
  }
})();
