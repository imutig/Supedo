import { Client, GatewayIntentBits, Collection, Events } from 'discord.js';
import { config } from 'dotenv';
import { readdirSync } from 'fs';
import { join } from 'path';
import { initializeDatabase } from './utils/dataSource';
import { initializeRepositories } from './utils/database';

config();

export interface Command {
  data: any;
  execute: (interaction: any) => Promise<void>;
}

export interface ClientWithCommands extends Client {
  commands: Collection<string, Command>;
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
  ],
}) as ClientWithCommands;

client.commands = new Collection();

// Initialize database connection
async function startBot() {
  try {
    console.log(`🚀 [STARTUP] Démarrage du bot Supedo...`);
    console.log(`🔧 [STARTUP] Configuration des intents Discord`);
    
    // Initialize database
    console.log(`🗄️ [DATABASE] Initialisation de la connexion à la base de données...`);
    await initializeDatabase();
    initializeRepositories();
    console.log(`✅ [DATABASE] Base de données initialisée avec succès`);

    // Load commands
    console.log(`⚡ [COMMANDS] Chargement des commandes...`);
    const commandsPath = join(__dirname, 'commands');
    const commandFiles = readdirSync(commandsPath).filter(file => 
      (file.endsWith('.js') || file.endsWith('.ts')) && !file.endsWith('.d.ts')
    );

    console.log(`📂 [COMMANDS] ${commandFiles.length} fichier(s) de commande(s) trouvé(s)`);

    for (const file of commandFiles) {
      const filePath = join(commandsPath, file);
      const command = require(filePath);
      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        console.log(`✅ [COMMANDS] Commande chargée : ${command.data.name}`);
      } else {
        console.log(`⚠️ [COMMANDS] La commande dans ${filePath} manque d'une propriété "data" ou "execute" requise.`);
      }
    }

    console.log(`✅ [COMMANDS] Toutes les commandes ont été chargées avec succès`);

    // Load events
    console.log(`🎯 [EVENTS] Chargement des événements...`);
    const eventsPath = join(__dirname, 'events');
    const eventFiles = readdirSync(eventsPath).filter(file => 
      (file.endsWith('.js') || file.endsWith('.ts')) && !file.endsWith('.d.ts')
    );

    console.log(`📂 [EVENTS] ${eventFiles.length} fichier(s) d'événement(s) trouvé(s)`);

    for (const file of eventFiles) {
      const filePath = join(eventsPath, file);
      const event = require(filePath);
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
      } else {
        client.on(event.name, (...args) => event.execute(...args));
      }
      console.log(`✅ [EVENTS] Événement chargé : ${event.name}`);
    }

    console.log(`✅ [EVENTS] Tous les événements ont été chargés avec succès`);

    // Login to Discord
    console.log(`🔐 [LOGIN] Connexion à Discord...`);
    await client.login(process.env.DISCORD_TOKEN);
    console.log(`🎉 [LOGIN] Connexion à Discord réussie !`);
    
  } catch (error) {
    console.error(`💥 [STARTUP] Erreur fatale lors du démarrage du bot :`, error);
    console.error('[ERREUR] Échec du démarrage du bot :', error);
    process.exit(1);
  }
}

// Start the bot
startBot();
