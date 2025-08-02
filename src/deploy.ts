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
    console.log(`[INFO] Commande chargée : ${command.data.name}`);
  } else {
    console.log(`[AVERTISSEMENT] La commande dans ${filePath} manque d'une propriété "data" ou "execute" requise.`);
  }
}

// Deploy commands
const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

(async () => {
  try {
    console.log(`Début du rafraîchissement des ${commands.length} commandes d'application (/).`);

    // Deploy to guild (faster for development)
    if (process.env.GUILD_ID) {
      const data = await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID),
        { body: commands },
      ) as any[];

      console.log(`Rechargement réussi de ${data.length} commandes d'application (/) pour le serveur.`);
    } else {
      // Deploy globally (takes up to 1 hour to propagate)
      const data = await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID!),
        { body: commands },
      ) as any[];

      console.log(`Rechargement réussi de ${data.length} commandes d'application (/) globalement.`);
    }
  } catch (error) {
    console.error('[ERREUR] Échec du déploiement des commandes :', error);
  }
})();
