import { Events, MessageFlags } from 'discord.js';
import { ClientWithCommands } from '../index';
import { routeButtonInteraction, routeSelectInteraction, routeModalInteraction, sendErrorReply } from '../utils/interactionRouter';

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction: any) {
    console.log(`🎯 [INTERACTION] Nouvelle interaction reçue de ${interaction.user.tag} (${interaction.user.id})`);
    console.log(`📋 [INTERACTION] Type: ${interaction.type}, Serveur: ${interaction.guild?.name || 'DM'}`);
    
    try {
      if (interaction.isChatInputCommand()) {
        await handleSlashCommand(interaction);
      } else if (interaction.isButton()) {
        console.log(`🔘 [BUTTON] Bouton cliqué: ${interaction.customId} par ${interaction.user.tag}`);
        await routeButtonInteraction(interaction);
      } else if (interaction.isStringSelectMenu()) {
        await routeSelectInteraction(interaction);
      } else if (interaction.isModalSubmit()) {
        await routeModalInteraction(interaction);
      }
    } catch (error) {
      console.error('[ERREUR] Erreur lors du traitement de l\'interaction :', error);
    }
  },
};

async function handleSlashCommand(interaction: any): Promise<void> {
  console.log(`⚡ [SLASH COMMAND] Commande: /${interaction.commandName}`);
  
  const client = interaction.client as ClientWithCommands;
  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`❌ [SLASH COMMAND] Aucune commande correspondant à ${interaction.commandName} n'a été trouvée.`);
    return;
  }

  console.log(`✅ [SLASH COMMAND] Commande ${interaction.commandName} trouvée, exécution...`);
  try {
    await command.execute(interaction);
    console.log(`✅ [SLASH COMMAND] Commande ${interaction.commandName} exécutée avec succès pour ${interaction.user.tag}`);
  } catch (error) {
    await sendErrorReply(interaction, error, `Erreur d'exécution de commande ${interaction.commandName} pour ${interaction.user.tag}`);
  }
}
