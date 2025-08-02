import { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  MessageFlags,
  version as djsVersion
} from 'discord.js';
import { TicketDB, RoleRequestDB, RoleGroupDB, TicketCategoryDB } from '../utils/database';
import { AppDataSource } from '../utils/dataSource';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Affiche les informations et statistiques du bot Supedo'),

  async execute(interaction: any) {
    try {
      console.log(`ℹ️ [INFO COMMAND] Commande /info exécutée par ${interaction.user.tag} (${interaction.user.id})`);
      console.log(`🏰 [INFO COMMAND] Serveur: ${interaction.guild.name} (${interaction.guild.id})`);

      // Defer reply to avoid timeout during data collection
      await interaction.deferReply({ ephemeral: false });
      console.log(`⏳ [INFO COMMAND] Réponse différée pour collecter les statistiques`);

      const client = interaction.client;
      const guild = interaction.guild;

      console.log(`📊 [INFO COMMAND] Collecte des statistiques générales...`);
      
      // Get basic bot stats
      const botUptime = process.uptime();
      const uptimeString = formatUptime(botUptime);
      const memoryUsage = process.memoryUsage();
      const memoryUsed = (memoryUsage.heapUsed / 1024 / 1024).toFixed(2);
      const memoryTotal = (memoryUsage.heapTotal / 1024 / 1024).toFixed(2);

      console.log(`🔍 [INFO COMMAND] Collecte des statistiques de base de données...`);
      
      // Get database stats for this guild
      let guildStats = {
        totalTickets: 0,
        openTickets: 0,
        ticketCategories: 0,
        roleGroups: 0,
        pendingRoleRequests: 0,
        totalRoleRequests: 0
      };

      try {
        // Tickets stats
        const allTickets = await TicketDB.findByGuild(guild.id);
        guildStats.totalTickets = allTickets.length;
        guildStats.openTickets = allTickets.filter(t => t.status === 'open').length;

        // Categories stats
        const categories = await TicketCategoryDB.findByGuild(guild.id);
        guildStats.ticketCategories = categories.length;

        // Role groups stats
        const roleGroups = await RoleGroupDB.findByGuild(guild.id);
        guildStats.roleGroups = roleGroups.length;

        // Role requests stats
        const allRoleRequests = await RoleRequestDB.findByGuild(guild.id);
        guildStats.totalRoleRequests = allRoleRequests.length;
        guildStats.pendingRoleRequests = allRoleRequests.filter((r: any) => r.status === 'pending').length;

        console.log(`✅ [INFO COMMAND] Statistiques collectées - Tickets: ${guildStats.totalTickets}, Groupes: ${guildStats.roleGroups}`);
      } catch (dbError) {
        console.error(`⚠️ [INFO COMMAND] Erreur lors de la collecte des stats DB:`, dbError);
      }

      // Calculate ping
      const ping = client.ws.ping;
      const dbPing = await getDatabasePing();

      console.log(`📡 [INFO COMMAND] Ping Discord: ${ping}ms, DB: ${dbPing}ms`);

      // Create main info embed
      const mainEmbed = new EmbedBuilder()
        .setTitle('🤖 Supedo - Informations du Bot')
        .setDescription('**Bot Discord professionnel** pour la gestion avancée des rôles et tickets')
        .setColor(0x0099FF)
        .setThumbnail(client.user.displayAvatarURL())
        .addFields(
          { 
            name: '📊 Statistiques Générales', 
            value: `🏰 **Serveurs:** ${client.guilds.cache.size}\n👥 **Utilisateurs:** ${client.users.cache.size}\n⏱️ **Uptime:** ${uptimeString}\n🧠 **Mémoire:** ${memoryUsed}MB / ${memoryTotal}MB`, 
            inline: true 
          },
          { 
            name: '📡 Performances', 
            value: `🏓 **Ping Discord:** ${ping}ms\n🗄️ **Ping DB:** ${dbPing}ms\n⚡ **Status:** ${ping < 100 ? '🟢 Excellent' : ping < 300 ? '🟡 Bon' : '🔴 Lent'}\n🔗 **Connexion:** ${client.ws.status === 0 ? '🟢 Stable' : '🔴 Instable'}`, 
            inline: true 
          },
          { 
            name: '📈 Statistiques du Serveur', 
            value: `🎫 **Tickets:** ${guildStats.totalTickets} (${guildStats.openTickets} ouverts)\n🏷️ **Catégories:** ${guildStats.ticketCategories}\n👥 **Groupes de rôles:** ${guildStats.roleGroups}\n⏳ **Demandes en attente:** ${guildStats.pendingRoleRequests}`, 
            inline: true 
          }
        )
        .setTimestamp();

      // Create features embed
      const featuresEmbed = new EmbedBuilder()
        .setTitle('⚡ Fonctionnalités Principales')
        .setColor(0x00FF00)
        .addFields(
          {
            name: '🎫 Système de Tickets Avancé',
            value: '• 📋 Panels personnalisables\n• 🎨 4 styles de boutons\n• 📁 Catégories Discord\n• ✏️ Renommage des tickets\n• 📊 Statistiques complètes',
            inline: true
          },
          {
            name: '🎭 Gestion des Rôles',
            value: '• 🎯 Système d\'approbation\n• 👥 Groupes de rôles\n• ➕ Ajout/Retrait unifié\n• ⏱️ Gestion des demandes',
            inline: true
          },
          {
            name: '🛠️ Interface Utilisateur',
            value: '• 🖱️ Boutons interactifs\n• 📝 Modals intuitifs\n• 🎛️ Menus déroulants\n• 🔄 Temps réel\n• 🎨 Design moderne',
            inline: true
          }
        )
        .addFields(
          {
            name: '🎯 Status des Services',
            value: `• **Discord API:** ${ping < 200 ? '🟢' : '🟡'} Opérationnel\n• **Base de données:** ${dbPing < 100 ? '🟢' : '🟡'} Opérationnelle\n• **Commandes:** 🟢 Fonctionnelles\n• **Événements:** 🟢 Actifs\n• **Logs:** 🟢 Complets`,
            inline: true
          },
          {
            name: '📚 Commandes Disponibles',
            value: '• `/role` - Gestion des rôles\n• `/ticket` - Gestion des tickets\n• `/info` - Informations du bot',
            inline: true
          },
          {
            name: '👨‍💻 Développeur',
            value: '**iMutig**',
            inline: true
          }
        );

      // Create action buttons
      const actionRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`info_refresh_${interaction.user.id}`)
            .setLabel('🔄 Actualiser')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`info_detailed_${interaction.user.id}`)
            .setLabel('📊 Stats Détaillées')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setLabel('📖 Documentation')
            .setStyle(ButtonStyle.Link)
            .setURL('https://github.com/imutig/Supedo'),
          new ButtonBuilder()
            .setLabel('🐛 Support')
            .setStyle(ButtonStyle.Link)
            .setURL('https://github.com/imutig/Supedo/issues')
        );

      console.log(`📤 [INFO COMMAND] Envoi des embeds d'information`);
      await interaction.editReply({ 
        embeds: [mainEmbed, featuresEmbed], 
        components: [actionRow] 
      });

      console.log(`✅ [INFO COMMAND] Commande /info exécutée avec succès pour ${interaction.user.tag}`);

    } catch (error) {
      console.error(`💥 [INFO COMMAND] Erreur dans la commande info pour ${interaction.user.tag} :`, error);
      
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Erreur')
        .setDescription('Une erreur est survenue lors de la récupération des informations.')
        .setColor(0xFF0000)
        .setTimestamp();

      try {
        if (interaction.deferred) {
          await interaction.editReply({ embeds: [errorEmbed] });
        } else {
          await interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
        }
      } catch (replyError) {
        console.error(`💥 [INFO COMMAND] Erreur lors de l'envoi de la réponse d'erreur :`, replyError);
      }
    }
  }
};

// Helper function to format uptime
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  let result = '';
  if (days > 0) result += `${days}j `;
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0) result += `${minutes}m `;
  result += `${secs}s`;

  return result.trim();
}

// Helper function to get database ping
async function getDatabasePing(): Promise<number> {
  try {
    const startTime = Date.now();
    await AppDataSource.query('SELECT 1');
    const endTime = Date.now();
    return endTime - startTime;
  } catch (error) {
    console.error('Erreur lors du test de ping DB:', error);
    return -1;
  }
}
