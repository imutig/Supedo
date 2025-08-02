import { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  PermissionFlagsBits,
  MessageFlags 
} from 'discord.js';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Gestion centralisée du système de tickets')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction: any) {
    const member = interaction.member;
    
    const embed = new EmbedBuilder()
      .setTitle('🎫 Gestion du Système de Tickets')
      .setDescription('Choisissez une action dans le menu ci-dessous')
      .setColor(0x0099FF)
      .setThumbnail(interaction.guild.iconURL())
      .addFields(
        { name: '📋 Créer un Panel', value: 'Créer un nouveau panel de tickets dans un salon', inline: true },
        { name: '⚙️ Gérer les Catégories', value: 'Modifier les catégories et boutons de tickets', inline: true },
        { name: '🎨 Personnaliser', value: 'Modifier l\'apparence des messages de tickets', inline: true },
        { name: '📊 Statistiques', value: 'Voir les statistiques des tickets', inline: true },
        { name: '🗑️ Supprimer Panel', value: 'Supprimer un panel de tickets existant', inline: true },
        { name: '📝 Lister les Panels', value: 'Voir tous les panels de tickets actifs', inline: true }
      )
      .setTimestamp();

    const actionRow1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`ticket_create_panel_${member.user.id}`)
          .setLabel('Créer un Panel')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('📋'),
        new ButtonBuilder()
          .setCustomId(`ticket_manage_categories_${member.user.id}`)
          .setLabel('Gérer Catégories')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('⚙️'),
        new ButtonBuilder()
          .setCustomId(`ticket_customize_${member.user.id}`)
          .setLabel('Personnaliser')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🎨')
      );

    const actionRow2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`ticket_stats_${member.user.id}`)
          .setLabel('Statistiques')
          .setStyle(ButtonStyle.Success)
          .setEmoji('📊'),
        new ButtonBuilder()
          .setCustomId(`ticket_delete_panel_${member.user.id}`)
          .setLabel('Supprimer Panel')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🗑️'),
        new ButtonBuilder()
          .setCustomId(`ticket_list_panels_${member.user.id}`)
          .setLabel('Lister Panels')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('📝')
      );

    await interaction.reply({ 
      embeds: [embed], 
      components: [actionRow1, actionRow2],
      flags: MessageFlags.Ephemeral
    });
  },
};
