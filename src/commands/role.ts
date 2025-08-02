import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, PermissionFlagsBits } from 'discord.js';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('role')
    .setDescription('Menu principal de gestion des rôles'),

  async execute(interaction: any) {
    try {
      console.log(`🎭 [ROLE COMMAND] Commande /role exécutée par ${interaction.user.tag} (${interaction.user.id})`);
      console.log(`🏰 [ROLE COMMAND] Serveur: ${interaction.guild.name} (${interaction.guild.id})`);
      
      const member = interaction.member;
      const hasManageRoles = member.permissions.has(PermissionFlagsBits.ManageRoles);
      
      console.log(`🔐 [ROLE COMMAND] Permissions - ManageRoles: ${hasManageRoles ? 'Oui' : 'Non'}`);

      console.log(`📝 [ROLE COMMAND] Création de l'embed principal`);
      const embed = new EmbedBuilder()
        .setTitle('🎭 Gestion des Rôles')
        .setDescription('Choisissez une action dans le menu ci-dessous')
        .setColor(0x0099FF)
        .setThumbnail(interaction.guild.iconURL())
        .addFields(
          { name: '👤 Demander un rôle', value: 'Demander un rôle spécifique ou un groupe de rôles', inline: true },
          { name: '❌ Retirer un rôle', value: 'Retirer un rôle que vous possédez', inline: true },
          { name: '📋 Mes rôles', value: 'Voir la liste de vos rôles actuels', inline: true }
        )
        .setTimestamp();

      console.log(`🔘 [ROLE COMMAND] Création des boutons utilisateur`);
      // User buttons (everyone can use these)
      const userRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`role_request_${member.user.id}`)
            .setLabel('Demander un Rôle')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('👤'),
          new ButtonBuilder()
            .setCustomId(`role_remove_${member.user.id}`)
            .setLabel('Retirer un Rôle')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('❌'),
          new ButtonBuilder()
            .setCustomId(`role_list_${member.user.id}`)
            .setLabel('Mes Rôles')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📋')
        );

      const components = [userRow];

      // Admin buttons (only for users with Manage Roles permission)
      if (hasManageRoles) {
        console.log(`⚙️ [ROLE COMMAND] Ajout des boutons d'administration`);
        embed.addFields(
          { name: '⚙️ Administration', value: 'Gérer les groupes de rôles (Admin uniquement)', inline: false }
        );

        const adminRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`rolegroup_manage_${member.user.id}`)
              .setLabel('Gérer les Groupes')
              .setStyle(ButtonStyle.Success)
              .setEmoji('⚙️'),
            new ButtonBuilder()
              .setCustomId(`role_pending_${member.user.id}`)
              .setLabel('Demandes en Attente')
              .setStyle(ButtonStyle.Secondary)
              .setEmoji('⏳')
          );

        components.push(adminRow);
      } else {
        console.log(`ℹ️ [ROLE COMMAND] Utilisateur sans permissions d'administration`);
      }

      console.log(`📤 [ROLE COMMAND] Envoi de la réponse avec ${components.length} composant(s)`);
      await interaction.reply({ 
        embeds: [embed], 
        components: components,
        flags: MessageFlags.Ephemeral 
      });
      
      console.log(`✅ [ROLE COMMAND] Commande /role exécutée avec succès pour ${interaction.user.tag}`);

    } catch (error) {
      console.error(`💥 [ROLE COMMAND] Erreur dans la commande role pour ${interaction.user.tag} :`, error);
      
      if (!interaction.replied && !interaction.deferred) {
        try {
          await interaction.reply({ 
            content: 'Une erreur est survenue lors du traitement de votre demande.', 
            flags: MessageFlags.Ephemeral 
          });
        } catch (replyError) {
          console.error('[ERREUR] Échec de l\'envoi de la réponse d\'erreur :', replyError);
        }
      }
      throw error;
    }
  },
};
