import { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  StringSelectMenuBuilder,
  MessageFlags,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType
} from 'discord.js';
import { TicketSetupDB, TicketCategoryDB, TicketPanelDB, TicketDB } from '../utils/database';

// Handle ticket panel creation
export async function handleTicketCreatePanel(interaction: any) {
  try {
    const [, , , userId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce bouton !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    // Check permissions
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({ 
        content: 'Vous n\'avez pas la permission de gérer les salons !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    // Get text channels for selection
    const textChannels = interaction.guild.channels.cache
      .filter((channel: any) => channel.type === ChannelType.GuildText)
      .first(25); // Discord limit

    if (textChannels.length === 0) {
      return interaction.reply({
        content: 'Aucun salon textuel disponible sur ce serveur.',
        flags: MessageFlags.Ephemeral
      });
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`ticket_panel_channel_${userId}`)
      .setPlaceholder('Choisissez un salon pour le panel de tickets')
      .addOptions(
        textChannels.map((channel: any) => ({
          label: `#${channel.name}`,
          value: channel.id,
          description: `Créer le panel dans #${channel.name}`,
          emoji: '📋'
        }))
      );

    const actionRow = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(selectMenu);

    const backRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`ticket_back_${userId}`)
          .setLabel('Retour')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );

    const embed = new EmbedBuilder()
      .setTitle('📋 Création de Panel de Tickets')
      .setDescription('**Étape 1:** Sélectionnez le salon où créer le panel de tickets.\\n\\n' +
                      'Le panel permettra aux utilisateurs de créer des tickets selon les catégories que vous définirez.')
      .setColor(0x0099FF);

    await interaction.update({ 
      embeds: [embed], 
      components: [actionRow, backRow] 
    });

  } catch (error) {
    console.error('Error handling ticket create panel:', error);
    await interaction.reply({ 
      content: 'Une erreur est survenue.', 
      flags: MessageFlags.Ephemeral 
    });
  }
}

// Handle channel selection for panel creation
export async function handleTicketPanelChannel(interaction: any) {
  try {
    const [, , , userId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce menu !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    const selectedChannelId = interaction.values[0];
    const channel = interaction.guild.channels.cache.get(selectedChannelId);

    if (!channel) {
      return interaction.reply({
        content: 'Salon introuvable.',
        flags: MessageFlags.Ephemeral
      });
    }

    // Show modal for panel customization
    const modal = new ModalBuilder()
      .setCustomId(`ticket_panel_setup_${userId}_${selectedChannelId}`)
      .setTitle('Configuration du Panel de Tickets');

    const titleInput = new TextInputBuilder()
      .setCustomId('panelTitle')
      .setLabel('Titre du panel')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ex: Créer un Ticket')
      .setRequired(true)
      .setMaxLength(100);

    const descInput = new TextInputBuilder()
      .setCustomId('panelDescription')
      .setLabel('Description du panel')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Ex: Cliquez sur un bouton ci-dessous pour créer un ticket selon votre besoin.')
      .setRequired(true)
      .setMaxLength(500);

    const colorInput = new TextInputBuilder()
      .setCustomId('panelColor')
      .setLabel('Couleur du panel (hex)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ex: #0099FF (optionnel)')
      .setRequired(false)
      .setMaxLength(7);

    const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput);
    const secondRow = new ActionRowBuilder<TextInputBuilder>().addComponents(descInput);
    const thirdRow = new ActionRowBuilder<TextInputBuilder>().addComponents(colorInput);
    
    modal.addComponents(firstRow, secondRow, thirdRow);

    await interaction.showModal(modal);

  } catch (error) {
    console.error('Error handling ticket panel channel:', error);
    await interaction.reply({ 
      content: 'Une erreur est survenue.', 
      flags: MessageFlags.Ephemeral 
    });
  }
}

// Handle panel setup modal submission
export async function handleTicketPanelSetup(interaction: any) {
  try {
    const [, , , userId, channelId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce modal !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    const title = interaction.fields.getTextInputValue('panelTitle').trim();
    const description = interaction.fields.getTextInputValue('panelDescription').trim();
    const colorInput = interaction.fields.getTextInputValue('panelColor').trim();

    // Validate color
    let color = 0x0099FF;
    if (colorInput && colorInput.startsWith('#')) {
      const hex = colorInput.slice(1);
      if (hex.length === 6 && /^[0-9A-F]{6}$/i.test(hex)) {
        color = parseInt(hex, 16);
      }
    }

    const channel = interaction.guild.channels.cache.get(channelId);
    if (!channel) {
      return interaction.reply({
        content: 'Salon introuvable.',
        flags: MessageFlags.Ephemeral
      });
    }

    // Create embed for the panel
    const panelEmbed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(color)
      .setTimestamp();

    // Get custom categories for this guild
    const categories = await TicketCategoryDB.findByGuild(interaction.guild.id);
    
    if (categories.length === 0) {
      return interaction.reply({
        content: '⚠️ Aucune catégorie de tickets configurée ! Créez d\'abord des catégories dans "Gérer Catégories".',
        flags: MessageFlags.Ephemeral
      });
    }

    // Create buttons from custom categories (max 5 per row)
    const components = [];
    let currentRow = new ActionRowBuilder<ButtonBuilder>();
    let buttonsInRow = 0;
    const buttonsConfig = [];

    for (const category of categories.slice(0, 25)) { // Discord limit
      if (buttonsInRow >= 5) {
        components.push(currentRow);
        currentRow = new ActionRowBuilder<ButtonBuilder>();
        buttonsInRow = 0;
      }

      const button = new ButtonBuilder()
        .setCustomId(`create_ticket_${category.categoryKey}`)
        .setLabel(category.buttonLabel)
        .setStyle(category.buttonStyle as ButtonStyle);

      if (category.buttonEmoji) {
        button.setEmoji(category.buttonEmoji);
      }

      currentRow.addComponents(button);
      buttonsInRow++;

      // Store button config for database
      buttonsConfig.push({
        id: `create_ticket_${category.categoryKey}`,
        label: category.buttonLabel,
        emoji: category.buttonEmoji || '',
        style: category.buttonStyle
      });
    }

    if (buttonsInRow > 0) {
      components.push(currentRow);
    }

    try {
      const message = await channel.send({ embeds: [panelEmbed], components: components });
      
      // Store panel in new table for enhanced management
      await TicketPanelDB.create({
        guildId: interaction.guild.id,
        channelId: channel.id,
        messageId: message.id,
        panelTitle: title,
        panelDescription: description,
        panelColor: parseInt(colorInput?.replace('#', ''), 16) || 0x0099FF,
        createdBy: interaction.user.id
      });

      // Store setup in database (legacy) - only if no existing entry
      try {
        const existingSetup = await TicketSetupDB.findByGuild(interaction.guild.id);
        if (!existingSetup) {
          await TicketSetupDB.create({
            guildId: interaction.guild.id,
            channelId: channel.id,
            messageId: message.id,
            embedTitle: title,
            embedDescription: description,
            embedColor: colorInput || '#0099FF',
            buttonsConfig: buttonsConfig
          });
        } else {
          // Update existing setup
          await TicketSetupDB.update(interaction.guild.id, {
            channelId: channel.id,
            messageId: message.id,
            embedTitle: title,
            embedDescription: description,
            embedColor: colorInput || '#0099FF',
            buttonsConfig: buttonsConfig
          });
        }
      } catch (error) {
        console.error('Error handling legacy ticket setup:', error);
        // Continue execution as the new table is our primary storage
      }

      const successEmbed = new EmbedBuilder()
        .setTitle('✅ Panel de Tickets Créé')
        .setDescription(`Le panel de tickets a été créé avec succès dans ${channel} !`)
        .addFields(
          { name: 'Salon', value: `<#${channel.id}>`, inline: true },
          { name: 'Message ID', value: message.id, inline: true },
          { name: 'Titre', value: title, inline: false }
        )
        .setColor(0x00FF00)
        .setTimestamp();

      const backRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`ticket_back_${userId}`)
            .setLabel('Retour au Menu')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔙')
        );

      await interaction.reply({ 
        embeds: [successEmbed], 
        components: [backRow],
        flags: MessageFlags.Ephemeral
      });

    } catch (error) {
      console.error('Error creating ticket panel:', error);
      await interaction.reply({
        content: 'Erreur lors de la création du panel. Vérifiez mes permissions dans ce salon.',
        flags: MessageFlags.Ephemeral
      });
    }

  } catch (error) {
    console.error('Error handling ticket panel setup:', error);
    await interaction.reply({ 
      content: 'Une erreur est survenue.', 
      flags: MessageFlags.Ephemeral 
    });
  }
}

// Handle back to main ticket menu
export async function handleTicketBack(interaction: any) {
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

  await interaction.update({ 
    embeds: [embed], 
    components: [actionRow1, actionRow2]
  });
}

// Handle ticket category management
export async function handleTicketManageCategories(interaction: any) {
  try {
    const [, , , userId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce bouton !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    // Check permissions
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({ 
        content: 'Vous n\'avez pas la permission de gérer les catégories !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    const categories = await TicketCategoryDB.findByGuild(interaction.guild.id);

    const embed = new EmbedBuilder()
      .setTitle('⚙️ Gestion des Catégories de Tickets')
      .setDescription('Gérez les catégories de tickets disponibles sur votre serveur.')
      .setColor(0x0099FF);

    if (categories.length > 0) {
      const categoryList = categories.map(cat => 
        `**${cat.categoryName}** (${cat.categoryKey})\n` +
        `└ Bouton: ${cat.buttonEmoji || ''} ${cat.buttonLabel}\n` +
        `└ Message: ${cat.openMessage ? 'Configuré' : 'Aucun'}`
      ).join('\n\n');
      
      embed.addFields({ name: 'Catégories Actuelles', value: categoryList, inline: false });
    }

    const actionRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`category_create_${userId}`)
          .setLabel('Créer Catégorie')
          .setStyle(ButtonStyle.Success)
          .setEmoji('➕'),
        new ButtonBuilder()
          .setCustomId(`category_edit_${userId}`)
          .setLabel('Modifier Catégorie')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('✏️'),
        new ButtonBuilder()
          .setCustomId(`category_delete_${userId}`)
          .setLabel('Supprimer Catégorie')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🗑️')
      );

    const backRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`ticket_back_${userId}`)
          .setLabel('Retour')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );

    await interaction.update({ 
      embeds: [embed], 
      components: [actionRow, backRow] 
    });

  } catch (error) {
    console.error('Error handling ticket manage categories:', error);
    await interaction.reply({ 
      content: 'Une erreur est survenue.', 
      flags: MessageFlags.Ephemeral 
    });
  }
}

// Handle ticket customization
export async function handleTicketCustomize(interaction: any) {
  try {
    const [, , userId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce bouton !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    // Get existing panels for customization
    const panels = await TicketPanelDB.findByGuild(interaction.guild.id);

    if (panels.length === 0) {
      return interaction.update({
        embeds: [new EmbedBuilder()
          .setTitle('⚠️ Aucun Panel Trouvé')
          .setDescription('Aucun panel de tickets n\'a été trouvé. Créez d\'abord un panel.')
          .setColor(0xFFAA00)],
        components: [new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`ticket_back_${userId}`)
              .setLabel('Retour')
              .setStyle(ButtonStyle.Secondary)
              .setEmoji('🔙')
          )]
      });
    }

    const selectOptions = panels.slice(0, 25).map(panel => ({
      label: panel.panelTitle,
      value: panel.id.toString(),
      description: `Canal: #${interaction.guild.channels.cache.get(panel.channelId)?.name || 'Salon supprimé'}`,
      emoji: '🎨'
    }));

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`panel_customize_select_${userId}`)
      .setPlaceholder('Choisissez un panel à personnaliser')
      .addOptions(selectOptions);

    const embed = new EmbedBuilder()
      .setTitle('🎨 Personnaliser un Panel')
      .setDescription('Sélectionnez le panel que vous souhaitez personnaliser.')
      .setColor(0x0099FF);

    const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(selectMenu);

    const backRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`ticket_back_${userId}`)
          .setLabel('Retour')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );

    await interaction.update({ 
      embeds: [embed], 
      components: [selectRow, backRow] 
    });

  } catch (error) {
    console.error('Error handling ticket customize:', error);
    await interaction.reply({ 
      content: 'Une erreur est survenue.', 
      flags: MessageFlags.Ephemeral 
    });
  }
}

// Handle ticket statistics
export async function handleTicketStats(interaction: any) {
  try {
    const [, , userId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce bouton !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    // Get ticket statistics from database
    const tickets = await TicketDB.findByGuild(interaction.guild.id);
    const openTickets = tickets.filter(ticket => ticket.status === 'open').length;
    const closedTickets = tickets.filter(ticket => ticket.status === 'closed').length;
    const totalTickets = tickets.length;

    // Get categories statistics
    const categories = await TicketCategoryDB.findByGuild(interaction.guild.id);
    const categoriesCount = categories.length;

    // Count tickets by category
    const categoryStats = categories.map(cat => {
      const categoryTickets = tickets.filter(ticket => ticket.ticketType === cat.categoryKey).length;
      return `${cat.buttonEmoji || '📋'} **${cat.categoryName}**: ${categoryTickets}`;
    }).join('\n') || 'Aucune catégorie configurée';

    const embed = new EmbedBuilder()
      .setTitle('📊 Statistiques des Tickets')
      .setDescription('Voici les statistiques actuelles du système de tickets sur ce serveur.')
      .addFields(
        { name: '🎫 Total des Tickets', value: totalTickets.toString(), inline: true },
        { name: '🟢 Tickets Ouverts', value: openTickets.toString(), inline: true },
        { name: '🔴 Tickets Fermés', value: closedTickets.toString(), inline: true },
        { name: '� Catégories Configurées', value: categoriesCount.toString(), inline: true },
        { name: '📈 Répartition par Catégorie', value: categoryStats, inline: false }
      )
      .setColor(0x00FF00)
      .setTimestamp();

    const backRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`ticket_back_${userId}`)
          .setLabel('Retour')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );

    await interaction.update({ 
      embeds: [embed], 
      components: [backRow] 
    });

  } catch (error) {
    console.error('Error handling ticket stats:', error);
    await interaction.reply({ 
      content: 'Une erreur est survenue.', 
      flags: MessageFlags.Ephemeral 
    });
  }
}

// Handle ticket panel deletion
export async function handleTicketDeletePanel(interaction: any) {
  try {
    const [, , , userId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce bouton !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    // Get existing panels for deletion
    const panels = await TicketPanelDB.findByGuild(interaction.guild.id);

    if (panels.length === 0) {
      return interaction.update({
        embeds: [new EmbedBuilder()
          .setTitle('⚠️ Aucun Panel Trouvé')
          .setDescription('Aucun panel de tickets n\'a été trouvé.')
          .setColor(0xFFAA00)],
        components: [new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`ticket_back_${userId}`)
              .setLabel('Retour')
              .setStyle(ButtonStyle.Secondary)
              .setEmoji('🔙')
          )]
      });
    }

    const selectOptions = panels.slice(0, 25).map(panel => {
      const channel = interaction.guild.channels.cache.get(panel.channelId);
      return {
        label: panel.panelTitle,
        value: panel.id.toString(),
        description: `Canal: #${channel?.name || 'Salon supprimé'} | Créé le ${panel.createdAt.toLocaleDateString('fr-FR')}`,
        emoji: '🗑️'
      };
    });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`panel_delete_select_${userId}`)
      .setPlaceholder('Choisissez un panel à supprimer')
      .addOptions(selectOptions);

    const embed = new EmbedBuilder()
      .setTitle('🗑️ Supprimer un Panel')
      .setDescription('⚠️ **Attention:** La suppression d\'un panel est définitive et supprimera le message du panel.')
      .setColor(0xFF4444);

    const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(selectMenu);

    const backRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`ticket_back_${userId}`)
          .setLabel('Retour')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );

    await interaction.update({ 
      embeds: [embed], 
      components: [selectRow, backRow] 
    });

  } catch (error) {
    console.error('Error handling ticket delete panel:', error);
    await interaction.reply({ 
      content: 'Une erreur est survenue.', 
      flags: MessageFlags.Ephemeral 
    });
  }
}

// Handle ticket panel listing
export async function handleTicketListPanels(interaction: any) {
  try {
    const [, , , userId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce bouton !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    // Get all panels for this guild
    const panels = await TicketPanelDB.findByGuild(interaction.guild.id);

    if (panels.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle('📝 Liste des Panels')
        .setDescription('Aucun panel de tickets n\'a été trouvé sur ce serveur.')
        .setColor(0xFFAA00);

      const backRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`ticket_back_${userId}`)
            .setLabel('Retour')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔙')
        );

      return interaction.update({ 
        embeds: [embed], 
        components: [backRow] 
      });
    }

    // Create panel list
    const panelList = panels.map((panel, index) => {
      const channel = interaction.guild.channels.cache.get(panel.channelId);
      const creator = interaction.guild.members.cache.get(panel.createdBy);
      const status = channel ? '🟢 Actif' : '🔴 Salon supprimé';
      
      return `**${index + 1}.** ${panel.panelTitle}
📍 Canal: ${channel ? `<#${channel.id}>` : 'Salon supprimé'}
👤 Créé par: ${creator ? creator.user.tag : 'Utilisateur inconnu'}
📅 Date: ${panel.createdAt.toLocaleDateString('fr-FR')}
🔗 [Aller au message](https://discord.com/channels/${panel.guildId}/${panel.channelId}/${panel.messageId})
${status}`;
    }).join('\n\n');

    const embed = new EmbedBuilder()
      .setTitle('📝 Liste des Panels de Tickets')
      .setDescription(`**${panels.length}** panel(s) trouvé(s) sur ce serveur:\n\n${panelList}`)
      .setColor(0x0099FF)
      .setFooter({ text: `Total: ${panels.length} panel(s)` })
      .setTimestamp();

    const actionRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`ticket_create_panel_${userId}`)
          .setLabel('Créer un Panel')
          .setStyle(ButtonStyle.Success)
          .setEmoji('➕'),
        new ButtonBuilder()
          .setCustomId(`ticket_delete_panel_${userId}`)
          .setLabel('Supprimer Panel')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🗑️'),
        new ButtonBuilder()
          .setCustomId(`ticket_customize_${userId}`)
          .setLabel('Personnaliser')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🎨')
      );

    const backRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`ticket_back_${userId}`)
          .setLabel('Retour')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );

    await interaction.update({ 
      embeds: [embed], 
      components: [actionRow, backRow] 
    });

  } catch (error) {
    console.error('Error handling ticket list panels:', error);
    await interaction.reply({ 
      content: 'Une erreur est survenue.', 
      flags: MessageFlags.Ephemeral 
    });
  }
}

// Handle category creation
export async function handleCategoryCreate(interaction: any) {
  try {
    const [, , userId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce bouton !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    // Get Discord categories for selection
    const guild = interaction.guild;
    const discordCategories = guild.channels.cache
      .filter((channel: any) => channel.type === ChannelType.GuildCategory)
      .map((category: any) => ({
        label: category.name,
        value: category.id,
        description: `Créer les tickets dans: ${category.name}`,
        emoji: '📁'
      }));

    if (discordCategories.length === 0) {
      return interaction.reply({
        content: 'Aucune catégorie Discord disponible. Créez d\'abord des catégories de salons.',
        flags: MessageFlags.Ephemeral
      });
    }

    // Add "Create new category" option
    discordCategories.unshift({
      label: 'Créer une nouvelle catégorie',
      value: 'create_new',
      description: 'Créer automatiquement une catégorie "Tickets"',
      emoji: '➕'
    });

    const categorySelect = new StringSelectMenuBuilder()
      .setCustomId(`category_select_discord_${userId}`)
      .setPlaceholder('Choisissez la catégorie Discord pour les tickets')
      .addOptions(discordCategories.slice(0, 25));

    const embed = new EmbedBuilder()
      .setTitle('🆕 Créer une Catégorie de Tickets')
      .setDescription('Choisissez d\'abord dans quelle catégorie Discord les tickets seront créés.')
      .setColor(0x0099FF);

    const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(categorySelect);

    const backRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`ticket_manage_categories_${userId}`)
          .setLabel('Retour')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );

    await interaction.update({ 
      embeds: [embed], 
      components: [selectRow, backRow] 
    });

  } catch (error) {
    console.error('Error handling category create:', error);
    await interaction.reply({ 
      content: 'Une erreur est survenue.', 
      flags: MessageFlags.Ephemeral 
    });
  }
}

// Handle Discord category selection for new ticket category
export async function handleCategorySelectDiscord(interaction: any) {
  try {
    const [, , , userId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce menu !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    const selectedCategoryId = interaction.values[0];

    // Show button style selection
    const styleOptions = [
      { label: 'Primaire (Bleu)', value: '1', emoji: '🔵', description: 'Bouton bleu' },
      { label: 'Secondaire (Gris)', value: '2', emoji: '⚪', description: 'Bouton gris' },
      { label: 'Succès (Vert)', value: '3', emoji: '🟢', description: 'Bouton vert' },
      { label: 'Echec (Rouge)', value: '4', emoji: '🔴', description: 'Bouton rouge' }
    ];

    const styleSelect = new StringSelectMenuBuilder()
      .setCustomId(`category_style_select_${userId}_${selectedCategoryId}`)
      .setPlaceholder('Choisissez la couleur du bouton')
      .addOptions(styleOptions);

    const embed = new EmbedBuilder()
      .setTitle('🎨 Choisir la Couleur du Bouton')
      .setDescription('Sélectionnez la couleur que vous souhaitez pour le bouton de cette catégorie.')
      .setColor(0x0099FF);

    const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(styleSelect);

    const backRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`category_create_${userId}`)
          .setLabel('Retour')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );

    await interaction.update({ 
      embeds: [embed], 
      components: [selectRow, backRow] 
    });

  } catch (error) {
    console.error('Error handling Discord category select:', error);
    await interaction.reply({ 
      content: 'Une erreur est survenue.', 
      flags: MessageFlags.Ephemeral 
    });
  }
}

// Handle button style selection and show creation modal
export async function handleCategoryStyleSelect(interaction: any) {
  try {
    const [, , , userId, discordCategoryId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce menu !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    const selectedStyle = interaction.values[0];

    // Show modal for category creation
    const modal = new ModalBuilder()
      .setCustomId(`category_create_modal_${userId}_${discordCategoryId}_${selectedStyle}`)
      .setTitle('Créer une Catégorie de Tickets');

    const keyInput = new TextInputBuilder()
      .setCustomId('categoryKey')
      .setLabel('Clé de la catégorie (identifiant unique)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ex: support, technique, facturation (sans espaces)')
      .setRequired(true)
      .setMaxLength(50);

    const nameInput = new TextInputBuilder()
      .setCustomId('categoryName')
      .setLabel('Nom de la catégorie')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ex: Support Général')
      .setRequired(true)
      .setMaxLength(100);

    const labelInput = new TextInputBuilder()
      .setCustomId('buttonLabel')
      .setLabel('Texte du bouton')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ex: Obtenir de l\'aide')
      .setRequired(true)
      .setMaxLength(80);

    const emojiInput = new TextInputBuilder()
      .setCustomId('buttonEmoji')
      .setLabel('Émoji du bouton (optionnel)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ex: 🎫, ⚙️, 💳')
      .setRequired(false)
      .setMaxLength(10);

    const messageInput = new TextInputBuilder()
      .setCustomId('openMessage')
      .setLabel('Message à l\'ouverture du ticket (optionnel)')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Message automatique envoyé quand un ticket de cette catégorie est créé')
      .setRequired(false)
      .setMaxLength(1000);

    const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(keyInput);
    const secondRow = new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput);
    const thirdRow = new ActionRowBuilder<TextInputBuilder>().addComponents(labelInput);
    const fourthRow = new ActionRowBuilder<TextInputBuilder>().addComponents(emojiInput);
    const fifthRow = new ActionRowBuilder<TextInputBuilder>().addComponents(messageInput);
    
    modal.addComponents(firstRow, secondRow, thirdRow, fourthRow, fifthRow);

    await interaction.showModal(modal);

  } catch (error) {
    console.error('Error handling style select:', error);
    await interaction.reply({ 
      content: 'Une erreur est survenue.', 
      flags: MessageFlags.Ephemeral 
    });
  }
}

// Handle category creation modal submission
export async function handleCategoryCreateModal(interaction: any) {
  try {
    const [, , , userId, discordCategoryId, buttonStyle] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce modal !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    const categoryKey = interaction.fields.getTextInputValue('categoryKey').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const categoryName = interaction.fields.getTextInputValue('categoryName').trim();
    const buttonLabel = interaction.fields.getTextInputValue('buttonLabel').trim();
    const buttonEmoji = interaction.fields.getTextInputValue('buttonEmoji').trim();
    const openMessage = interaction.fields.getTextInputValue('openMessage').trim();

    if (!categoryKey || !categoryName || !buttonLabel) {
      return interaction.reply({
        content: 'Veuillez remplir tous les champs obligatoires.',
        flags: MessageFlags.Ephemeral
      });
    }

    // Check if category key already exists
    const existingCategory = await TicketCategoryDB.findByCategoryKey(interaction.guild.id, categoryKey);
    if (existingCategory) {
      return interaction.reply({
        content: `Une catégorie avec la clé "${categoryKey}" existe déjà.`,
        flags: MessageFlags.Ephemeral
      });
    }

    // Handle Discord category creation if needed
    let finalDiscordCategoryId = discordCategoryId;
    if (discordCategoryId === 'create_new') {
      try {
        const newCategory = await interaction.guild.channels.create({
          name: 'Tickets',
          type: ChannelType.GuildCategory,
          permissionOverwrites: [
            {
              id: interaction.guild.id,
              deny: [PermissionFlagsBits.ViewChannel],
            },
          ],
        });
        finalDiscordCategoryId = newCategory.id;
      } catch (error) {
        console.error('Error creating Discord category:', error);
        return interaction.reply({
          content: 'Erreur lors de la création de la catégorie Discord.',
          flags: MessageFlags.Ephemeral
        });
      }
    }

    try {
      await TicketCategoryDB.create({
        guildId: interaction.guild.id,
        categoryKey: categoryKey,
        categoryName: categoryName,
        buttonLabel: buttonLabel,
        buttonEmoji: buttonEmoji || undefined,
        buttonStyle: parseInt(buttonStyle),
        discordCategoryId: finalDiscordCategoryId,
        openMessage: openMessage || undefined
      });

      const styleNames = {
        '1': 'Primaire (Bleu)',
        '2': 'Secondaire (Gris)', 
        '3': 'Succès (Vert)',
        '4': 'Danger (Rouge)'
      };

      const categoryChannel = await interaction.guild.channels.fetch(finalDiscordCategoryId);

      const successEmbed = new EmbedBuilder()
        .setTitle('✅ Catégorie Créée')
        .setDescription(`La catégorie **${categoryName}** a été créée avec succès !`)
        .addFields(
          { name: 'Clé', value: categoryKey, inline: true },
          { name: 'Bouton', value: `${buttonEmoji || ''} ${buttonLabel}`, inline: true },
          { name: 'Couleur', value: styleNames[buttonStyle as keyof typeof styleNames], inline: true },
          { name: 'Catégorie Discord', value: categoryChannel?.name || 'Inconnue', inline: true },
          { name: 'Message d\'ouverture', value: openMessage || 'Aucun', inline: false }
        )
        .setColor(0x00FF00)
        .setTimestamp();

      const backRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`ticket_manage_categories_${userId}`)
            .setLabel('Retour aux Catégories')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔙')
        );

      await interaction.reply({ 
        embeds: [successEmbed], 
        components: [backRow],
        flags: MessageFlags.Ephemeral
      });

    } catch (error) {
      console.error('Error creating category:', error);
      await interaction.reply({
        content: 'Erreur lors de la création de la catégorie.',
        flags: MessageFlags.Ephemeral
      });
    }

  } catch (error) {
    console.error('Error handling category create modal:', error);
    await interaction.reply({ 
      content: 'Une erreur est survenue.', 
      flags: MessageFlags.Ephemeral 
    });
  }
}

// Handle category editing
export async function handleCategoryEdit(interaction: any) {
  try {
    const [, , userId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce bouton !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    const categories = await TicketCategoryDB.findByGuild(interaction.guild.id);

    if (categories.length === 0) {
      return interaction.reply({
        content: 'Aucune catégorie à modifier. Créez d\'abord une catégorie.',
        flags: MessageFlags.Ephemeral
      });
    }

    const selectOptions = categories.slice(0, 25).map(cat => ({
      label: cat.categoryName,
      value: cat.id.toString(),
      description: `Clé: ${cat.categoryKey} | Bouton: ${cat.buttonLabel}`,
      emoji: cat.buttonEmoji || '📝'
    }));

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`category_edit_select_${userId}`)
      .setPlaceholder('Choisissez une catégorie à modifier')
      .addOptions(selectOptions);

    const actionRow = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(selectMenu);

    const backRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`ticket_manage_categories_${userId}`)
          .setLabel('Retour')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );

    const embed = new EmbedBuilder()
      .setTitle('✏️ Modifier une Catégorie')
      .setDescription('Sélectionnez la catégorie que vous souhaitez modifier.')
      .setColor(0x0099FF);

    await interaction.update({ 
      embeds: [embed], 
      components: [actionRow, backRow] 
    });

  } catch (error) {
    console.error('Error handling category edit:', error);
    await interaction.reply({ 
      content: 'Une erreur est survenue.', 
      flags: MessageFlags.Ephemeral 
    });
  }
}

// Handle category deletion
export async function handleCategoryDelete(interaction: any) {
  try {
    const [, , userId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce bouton !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    const categories = await TicketCategoryDB.findByGuild(interaction.guild.id);

    if (categories.length === 0) {
      return interaction.reply({
        content: 'Aucune catégorie à supprimer.',
        flags: MessageFlags.Ephemeral
      });
    }

    const selectOptions = categories.slice(0, 25).map(cat => ({
      label: cat.categoryName,
      value: cat.id.toString(),
      description: `Clé: ${cat.categoryKey} | Bouton: ${cat.buttonLabel}`,
      emoji: '🗑️'
    }));

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`category_delete_select_${userId}`)
      .setPlaceholder('Choisissez une catégorie à supprimer')
      .addOptions(selectOptions);

    const actionRow = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(selectMenu);

    const backRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`ticket_manage_categories_${userId}`)
          .setLabel('Retour')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );

    const embed = new EmbedBuilder()
      .setTitle('🗑️ Supprimer une Catégorie')
      .setDescription('⚠️ **Attention:** La suppression d\'une catégorie est définitive.')
      .setColor(0xFF4444);

    await interaction.update({ 
      embeds: [embed], 
      components: [actionRow, backRow] 
    });

  } catch (error) {
    console.error('Error handling category delete:', error);
    await interaction.reply({ 
      content: 'Une erreur est survenue.', 
      flags: MessageFlags.Ephemeral 
    });
  }
}

// Handle category edit select menu
export async function handleCategoryEditSelect(interaction: any) {
  try {
    const [, , , userId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce menu !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    const categoryId = parseInt(interaction.values[0]);
    const category = await TicketCategoryDB.findById(categoryId);

    if (!category) {
      return interaction.reply({
        content: 'Catégorie introuvable.',
        flags: MessageFlags.Ephemeral
      });
    }

    // Show button style selection for editing
    const styleOptions = [
      { label: 'Primaire (Bleu)', value: '1', emoji: '🔵', description: 'Bouton bleu (recommandé)' },
      { label: 'Secondaire (Gris)', value: '2', emoji: '⚪', description: 'Bouton gris' },
      { label: 'Succès (Vert)', value: '3', emoji: '🟢', description: 'Bouton vert' },
      { label: 'Danger (Rouge)', value: '4', emoji: '🔴', description: 'Bouton rouge' }
    ];

    const styleSelect = new StringSelectMenuBuilder()
      .setCustomId(`category_edit_style_select_${userId}_${categoryId}`)
      .setPlaceholder('Choisissez la nouvelle couleur du bouton')
      .addOptions(styleOptions);

    const currentStyleName = {
      1: 'Primaire (Bleu)',
      2: 'Secondaire (Gris)', 
      3: 'Succès (Vert)',
      4: 'Danger (Rouge)'
    }[category.buttonStyle] || 'Inconnue';

    const embed = new EmbedBuilder()
      .setTitle('🎨 Modifier la Couleur du Bouton')
      .setDescription(`Modification de la catégorie **${category.categoryName}**\n\nCouleur actuelle: **${currentStyleName}**\n\nSélectionnez la nouvelle couleur pour le bouton.`)
      .setColor(0x0099FF);

    const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(styleSelect);

    const backRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`category_edit_${userId}`)
          .setLabel('Retour')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );

    await interaction.update({ 
      embeds: [embed], 
      components: [selectRow, backRow] 
    });

  } catch (error) {
    console.error('Error handling category edit select:', error);
    await interaction.reply({ 
      content: 'Une erreur est survenue.', 
      flags: MessageFlags.Ephemeral 
    });
  }
}

// Handle category edit style selection
export async function handleCategoryEditStyleSelect(interaction: any) {
  try {
    const [, , , , userId, categoryId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce menu !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    const selectedStyle = parseInt(interaction.values[0]);
    const category = await TicketCategoryDB.findById(parseInt(categoryId));

    if (!category) {
      return interaction.reply({
        content: 'Catégorie introuvable.',
        flags: MessageFlags.Ephemeral
      });
    }

    // Get Discord categories for selection
    const guild = interaction.guild;
    const discordCategories = guild.channels.cache
      .filter((channel: any) => channel.type === ChannelType.GuildCategory)
      .map((category: any) => ({
        label: category.name,
        value: category.id,
        description: `Créer les tickets dans: ${category.name}`,
        emoji: '📁'
      }));

    if (discordCategories.length === 0) {
      return interaction.reply({
        content: 'Aucune catégorie Discord disponible. Créez d\'abord des catégories de salons.',
        flags: MessageFlags.Ephemeral
      });
    }

    // Add "Create new category" option
    discordCategories.unshift({
      label: 'Créer une nouvelle catégorie',
      value: 'create_new',
      description: 'Créer automatiquement une catégorie "Tickets"',
      emoji: '➕'
    });

    const categorySelect = new StringSelectMenuBuilder()
      .setCustomId(`category_edit_discord_select_${userId}_${categoryId}_${selectedStyle}`)
      .setPlaceholder('Choisissez la catégorie Discord pour les tickets')
      .addOptions(discordCategories.slice(0, 25));

    const currentCategory = guild.channels.cache.get(category.discordCategoryId);
    const currentCategoryName = currentCategory ? currentCategory.name : 'Catégorie supprimée';

    const embed = new EmbedBuilder()
      .setTitle('📁 Choisir la Catégorie Discord')
      .setDescription(`Modification de la catégorie **${category.categoryName}**\n\nCatégorie Discord actuelle: **${currentCategoryName}**\n\nChoisissez dans quelle catégorie Discord les tickets de cette catégorie seront créés.`)
      .setColor(0x0099FF);

    const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(categorySelect);

    const backRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`category_edit_${userId}`)
          .setLabel('Retour')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );

    await interaction.update({ 
      embeds: [embed], 
      components: [selectRow, backRow] 
    });

  } catch (error) {
    console.error('Error handling category edit style select:', error);
    await interaction.reply({ 
      content: 'Une erreur est survenue.', 
      flags: MessageFlags.Ephemeral 
    });
  }
}

// Handle category edit Discord category selection
export async function handleCategoryEditDiscordSelect(interaction: any) {
  try {
    const [, , , , userId, categoryId, selectedStyle] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce menu !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    const selectedDiscordCategory = interaction.values[0];
    const category = await TicketCategoryDB.findById(parseInt(categoryId));

    if (!category) {
      return interaction.reply({
        content: 'Catégorie introuvable.',
        flags: MessageFlags.Ephemeral
      });
    }

    // Show modal for category editing with selected style and Discord category
    const modal = new ModalBuilder()
      .setCustomId(`category_edit_modal_${userId}_${categoryId}_${selectedStyle}_${selectedDiscordCategory}`)
      .setTitle(`Modifier: ${category.categoryName}`);

    const nameInput = new TextInputBuilder()
      .setCustomId('categoryName')
      .setLabel('Nom de la catégorie')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ex: Support Général')
      .setValue(category.categoryName)
      .setRequired(true)
      .setMaxLength(100);

    const labelInput = new TextInputBuilder()
      .setCustomId('buttonLabel')
      .setLabel('Texte du bouton')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ex: Obtenir de l\'aide')
      .setValue(category.buttonLabel)
      .setRequired(true)
      .setMaxLength(80);

    const emojiInput = new TextInputBuilder()
      .setCustomId('buttonEmoji')
      .setLabel('Émoji du bouton (optionnel)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ex: 🎫, ⚙️, 💳')
      .setValue(category.buttonEmoji || '')
      .setRequired(false)
      .setMaxLength(10);

    const messageInput = new TextInputBuilder()
      .setCustomId('openMessage')
      .setLabel('Message à l\'ouverture du ticket (optionnel)')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Message automatique envoyé quand un ticket de cette catégorie est créé')
      .setValue(category.openMessage || '')
      .setRequired(false)
      .setMaxLength(1000);

    const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput);
    const secondRow = new ActionRowBuilder<TextInputBuilder>().addComponents(labelInput);
    const thirdRow = new ActionRowBuilder<TextInputBuilder>().addComponents(emojiInput);
    const fourthRow = new ActionRowBuilder<TextInputBuilder>().addComponents(messageInput);
    
    modal.addComponents(firstRow, secondRow, thirdRow, fourthRow);

    await interaction.showModal(modal);

  } catch (error) {
    console.error('Error handling category edit Discord select:', error);
    await interaction.reply({ 
      content: 'Une erreur est survenue.', 
      flags: MessageFlags.Ephemeral 
    });
  }
}

// Handle category edit modal submission
export async function handleCategoryEditModal(interaction: any) {
  try {
    const customIdParts = interaction.customId.split('_');
    const userId = customIdParts[3];
    const categoryId = customIdParts[4];
    const buttonStyle = customIdParts[5] ? parseInt(customIdParts[5]) : null;
    const discordCategoryId = customIdParts[6] || null;
    
    if (interaction.user.id !== userId) {
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce modal !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    const category = await TicketCategoryDB.findById(parseInt(categoryId));
    if (!category) {
      return interaction.reply({
        content: 'Catégorie introuvable.',
        flags: MessageFlags.Ephemeral
      });
    }

    const categoryName = interaction.fields.getTextInputValue('categoryName').trim();
    const buttonLabel = interaction.fields.getTextInputValue('buttonLabel').trim();
    const buttonEmoji = interaction.fields.getTextInputValue('buttonEmoji').trim();
    const openMessage = interaction.fields.getTextInputValue('openMessage').trim();

    if (!categoryName || !buttonLabel) {
      return interaction.reply({
        content: 'Veuillez remplir tous les champs obligatoires.',
        flags: MessageFlags.Ephemeral
      });
    }

    try {
      const updateData: any = {
        categoryName: categoryName,
        buttonLabel: buttonLabel,
        buttonEmoji: buttonEmoji || undefined,
        openMessage: openMessage || undefined
      };

      // If a new button style was selected, include it in the update
      if (buttonStyle !== null && buttonStyle >= 1 && buttonStyle <= 4) {
        updateData.buttonStyle = buttonStyle;
      }

      // Handle Discord category update
      let finalDiscordCategoryId = category.discordCategoryId;
      if (discordCategoryId && discordCategoryId !== 'null') {
        if (discordCategoryId === 'create_new') {
          try {
            const newCategory = await interaction.guild.channels.create({
              name: 'Tickets',
              type: ChannelType.GuildCategory,
              permissionOverwrites: [
                {
                  id: interaction.guild.id,
                  deny: [PermissionFlagsBits.ViewChannel],
                },
              ],
            });
            finalDiscordCategoryId = newCategory.id;
            updateData.discordCategoryId = finalDiscordCategoryId;
          } catch (error) {
            console.error('Error creating Discord category:', error);
            return interaction.reply({
              content: 'Erreur lors de la création de la catégorie Discord.',
              flags: MessageFlags.Ephemeral
            });
          }
        } else {
          finalDiscordCategoryId = discordCategoryId;
          updateData.discordCategoryId = finalDiscordCategoryId;
        }
      }

      await TicketCategoryDB.update(parseInt(categoryId), updateData);

      const styleNames: { [key: number]: string } = {
        1: 'Primaire (Bleu)',
        2: 'Secondaire (Gris)', 
        3: 'Succès (Vert)',
        4: 'Danger (Rouge)'
      };

      const finalButtonStyle = buttonStyle || category.buttonStyle;
      const styleName = styleNames[finalButtonStyle] || 'Inconnue';

      // Get Discord category name for display
      const discordCategory = await interaction.guild.channels.fetch(finalDiscordCategoryId).catch(() => null);
      const discordCategoryName = discordCategory ? discordCategory.name : 'Catégorie inconnue';

      const successEmbed = new EmbedBuilder()
        .setTitle('✅ Catégorie Modifiée')
        .setDescription(`La catégorie **${categoryName}** a été modifiée avec succès !`)
        .addFields(
          { name: 'Clé', value: category.categoryKey, inline: true },
          { name: 'Bouton', value: `${buttonEmoji || ''} ${buttonLabel}`, inline: true },
          { name: 'Couleur du bouton', value: styleName, inline: true },
          { name: 'Catégorie Discord', value: discordCategoryName, inline: true },
          { name: 'Message d\'ouverture', value: openMessage || 'Aucun', inline: false }
        )
        .setColor(0x00FF00)
        .setTimestamp();

      const backRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`ticket_manage_categories_${userId}`)
            .setLabel('Retour aux Catégories')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔙')
        );

      await interaction.reply({ 
        embeds: [successEmbed], 
        components: [backRow],
        flags: MessageFlags.Ephemeral
      });

    } catch (error) {
      console.error('Error updating category:', error);
      await interaction.reply({
        content: 'Erreur lors de la modification de la catégorie.',
        flags: MessageFlags.Ephemeral
      });
    }

  } catch (error) {
    console.error('Error handling category edit modal:', error);
    await interaction.reply({ 
      content: 'Une erreur est survenue.', 
      flags: MessageFlags.Ephemeral 
    });
  }
}

// Handle category delete select menu
export async function handleCategoryDeleteSelect(interaction: any) {
  try {
    const [, , , userId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce menu !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    const categoryId = parseInt(interaction.values[0]);
    const category = await TicketCategoryDB.findById(categoryId);

    if (!category) {
      return interaction.reply({
        content: 'Catégorie introuvable.',
        flags: MessageFlags.Ephemeral
      });
    }

    const confirmEmbed = new EmbedBuilder()
      .setTitle('⚠️ Confirmation de Suppression')
      .setDescription(`Êtes-vous sûr de vouloir supprimer la catégorie **${category.categoryName}** ?`)
      .addFields(
        { name: 'Clé', value: category.categoryKey, inline: true },
        { name: 'Bouton', value: `${category.buttonEmoji || ''} ${category.buttonLabel}`, inline: true }
      )
      .setColor(0xFF4444)
      .setFooter({ text: 'Cette action est irréversible!' });

    const confirmRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`category_delete_confirm_${userId}_${categoryId}`)
          .setLabel('Confirmer la Suppression')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🗑️'),
        new ButtonBuilder()
          .setCustomId(`ticket_manage_categories_${userId}`)
          .setLabel('Annuler')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('❌')
      );

    await interaction.update({ 
      embeds: [confirmEmbed], 
      components: [confirmRow] 
    });

  } catch (error) {
    console.error('Error handling category delete select:', error);
    await interaction.reply({ 
      content: 'Une erreur est survenue.', 
      flags: MessageFlags.Ephemeral 
    });
  }
}

// Handle category delete confirmation
export async function handleCategoryDeleteConfirm(interaction: any) {
  try {
    const [, , , userId, categoryId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce bouton !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    const category = await TicketCategoryDB.findById(parseInt(categoryId));
    if (!category) {
      return interaction.reply({
        content: 'Catégorie introuvable.',
        flags: MessageFlags.Ephemeral
      });
    }

    try {
      await TicketCategoryDB.delete(parseInt(categoryId));

      const successEmbed = new EmbedBuilder()
        .setTitle('✅ Catégorie Supprimée')
        .setDescription(`La catégorie **${category.categoryName}** a été supprimée avec succès.`)
        .setColor(0x00FF00)
        .setTimestamp();

      const backRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`ticket_manage_categories_${userId}`)
            .setLabel('Retour aux Catégories')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔙')
        );

      await interaction.update({ 
        embeds: [successEmbed], 
        components: [backRow]
      });

    } catch (error) {
      console.error('Error deleting category:', error);
      await interaction.reply({
        content: 'Erreur lors de la suppression de la catégorie.',
        flags: MessageFlags.Ephemeral
      });
    }

  } catch (error) {
    console.error('Error handling category delete confirm:', error);
    await interaction.reply({ 
      content: 'Une erreur est survenue.', 
      flags: MessageFlags.Ephemeral 
    });
  }
}

// Handle panel customization selection
export async function handlePanelCustomizeSelect(interaction: any) {
  try {
    const [, , , userId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce menu !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    const panelId = parseInt(interaction.values[0]);
    const panel = await TicketPanelDB.findById(panelId);

    if (!panel) {
      return interaction.reply({
        content: 'Panel introuvable.',
        flags: MessageFlags.Ephemeral
      });
    }

    // Show modal for panel customization
    const modal = new ModalBuilder()
      .setCustomId(`panel_customize_modal_${userId}_${panelId}`)
      .setTitle('Personnaliser le Panel');

    const titleInput = new TextInputBuilder()
      .setCustomId('panelTitle')
      .setLabel('Titre du panel')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ex: Système de Support')
      .setValue(panel.panelTitle)
      .setRequired(true)
      .setMaxLength(100);

    const descInput = new TextInputBuilder()
      .setCustomId('panelDescription')
      .setLabel('Description du panel')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Description affichée dans le panel')
      .setValue(panel.panelDescription || '')
      .setRequired(false)
      .setMaxLength(1000);

    const colorInput = new TextInputBuilder()
      .setCustomId('panelColor')
      .setLabel('Couleur (hexadécimal)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ex: #0099FF, #FF5733')
      .setValue(`#${panel.panelColor.toString(16).padStart(6, '0')}`)
      .setRequired(false)
      .setMaxLength(7);

    const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput);
    const secondRow = new ActionRowBuilder<TextInputBuilder>().addComponents(descInput);
    const thirdRow = new ActionRowBuilder<TextInputBuilder>().addComponents(colorInput);
    
    modal.addComponents(firstRow, secondRow, thirdRow);

    await interaction.showModal(modal);

  } catch (error) {
    console.error('Error handling panel customize select:', error);
    await interaction.reply({ 
      content: 'Une erreur est survenue.', 
      flags: MessageFlags.Ephemeral 
    });
  }
}

// Handle panel customization modal
export async function handlePanelCustomizeModal(interaction: any) {
  try {
    const [, , , userId, panelId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce modal !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    const panel = await TicketPanelDB.findById(parseInt(panelId));
    if (!panel) {
      return interaction.reply({
        content: 'Panel introuvable.',
        flags: MessageFlags.Ephemeral
      });
    }

    const panelTitle = interaction.fields.getTextInputValue('panelTitle').trim();
    const panelDescription = interaction.fields.getTextInputValue('panelDescription').trim();
    const panelColorInput = interaction.fields.getTextInputValue('panelColor').trim();

    if (!panelTitle) {
      return interaction.reply({
        content: 'Le titre est obligatoire.',
        flags: MessageFlags.Ephemeral
      });
    }

    // Parse color
    let panelColor = panel.panelColor;
    if (panelColorInput) {
      const colorMatch = panelColorInput.match(/^#?([A-Fa-f0-9]{6})$/);
      if (colorMatch) {
        panelColor = parseInt(colorMatch[1], 16);
      }
    }

    try {
      // Update panel in database
      await TicketPanelDB.update(parseInt(panelId), {
        panelTitle: panelTitle,
        panelDescription: panelDescription || undefined,
        panelColor: panelColor
      });

      // Update the actual Discord message
      const channel = await interaction.guild.channels.fetch(panel.channelId);
      if (channel) {
        try {
          const message = await channel.messages.fetch(panel.messageId);
          const categories = await TicketCategoryDB.findByGuild(interaction.guild.id);
          
          if (categories.length > 0) {
            const components = [];
            for (let i = 0; i < categories.length; i += 5) {
              const chunk = categories.slice(i, i + 5);
              const row = new ActionRowBuilder<ButtonBuilder>();
              
              for (const category of chunk) {
                const button = new ButtonBuilder()
                  .setCustomId(`create_ticket_${category.categoryKey}`)
                  .setLabel(category.buttonLabel)
                  .setStyle(category.buttonStyle);
                
                if (category.buttonEmoji) {
                  button.setEmoji(category.buttonEmoji);
                }
                
                row.addComponents(button);
              }
              components.push(row);
            }

            const updatedEmbed = new EmbedBuilder()
              .setTitle(panelTitle)
              .setDescription(panelDescription || 'Cliquez sur un bouton ci-dessous pour créer un ticket.')
              .setColor(panelColor)
              .setTimestamp();

            await message.edit({ embeds: [updatedEmbed], components });
          }
        } catch (error) {
          console.error('Error updating Discord message:', error);
        }
      }

      const successEmbed = new EmbedBuilder()
        .setTitle('✅ Panel Personnalisé')
        .setDescription(`Le panel **${panelTitle}** a été personnalisé avec succès !`)
        .setColor(panelColor)
        .setTimestamp();

      const backRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`ticket_customize_${userId}`)
            .setLabel('Retour à la Personnalisation')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔙')
        );

      await interaction.reply({ 
        embeds: [successEmbed], 
        components: [backRow],
        flags: MessageFlags.Ephemeral
      });

    } catch (error) {
      console.error('Error updating panel:', error);
      await interaction.reply({
        content: 'Erreur lors de la personnalisation du panel.',
        flags: MessageFlags.Ephemeral
      });
    }

  } catch (error) {
    console.error('Error handling panel customize modal:', error);
    await interaction.reply({ 
      content: 'Une erreur est survenue.', 
      flags: MessageFlags.Ephemeral 
    });
  }
}

// Handle panel deletion selection
export async function handlePanelDeleteSelect(interaction: any) {
  try {
    const [, , , userId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce menu !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    const panelId = parseInt(interaction.values[0]);
    const panel = await TicketPanelDB.findById(panelId);

    if (!panel) {
      return interaction.reply({
        content: 'Panel introuvable.',
        flags: MessageFlags.Ephemeral
      });
    }

    const channel = interaction.guild.channels.cache.get(panel.channelId);

    const confirmEmbed = new EmbedBuilder()
      .setTitle('⚠️ Confirmation de Suppression')
      .setDescription(`Êtes-vous sûr de vouloir supprimer le panel **${panel.panelTitle}** ?`)
      .addFields(
        { name: 'Canal', value: channel ? `<#${channel.id}>` : 'Salon supprimé', inline: true },
        { name: 'Créé le', value: panel.createdAt.toLocaleDateString('fr-FR'), inline: true }
      )
      .setColor(0xFF4444)
      .setFooter({ text: 'Cette action supprimera aussi le message Discord!' });

    const confirmRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`panel_delete_confirm_${userId}_${panelId}`)
          .setLabel('Confirmer la Suppression')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🗑️'),
        new ButtonBuilder()
          .setCustomId(`ticket_delete_panel_${userId}`)
          .setLabel('Annuler')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('❌')
      );

    await interaction.update({ 
      embeds: [confirmEmbed], 
      components: [confirmRow] 
    });

  } catch (error) {
    console.error('Error handling panel delete select:', error);
    await interaction.reply({ 
      content: 'Une erreur est survenue.', 
      flags: MessageFlags.Ephemeral 
    });
  }
}

// Handle panel deletion confirmation
export async function handlePanelDeleteConfirm(interaction: any) {
  try {
    const [, , , userId, panelId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce bouton !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    const panel = await TicketPanelDB.findById(parseInt(panelId));
    if (!panel) {
      return interaction.reply({
        content: 'Panel introuvable.',
        flags: MessageFlags.Ephemeral
      });
    }

    try {
      // Delete Discord message first
      const channel = await interaction.guild.channels.fetch(panel.channelId);
      if (channel) {
        try {
          const message = await channel.messages.fetch(panel.messageId);
          await message.delete();
        } catch (error) {
          console.error('Error deleting Discord message:', error);
        }
      }

      // Delete from database
      await TicketPanelDB.delete(parseInt(panelId));

      // Check if this was the last panel and clean up legacy table
      try {
        const remainingPanels = await TicketPanelDB.findByGuild(interaction.guild.id);
        if (remainingPanels.length === 0) {
          // No more panels, clean up legacy table
          const existingSetup = await TicketSetupDB.findByGuild(interaction.guild.id);
          if (existingSetup) {
            await TicketSetupDB.delete(interaction.guild.id);
          }
        }
      } catch (error) {
        console.error('Error cleaning up legacy ticket setup:', error);
        // Continue execution as this is not critical
      }

      const successEmbed = new EmbedBuilder()
        .setTitle('✅ Panel Supprimé')
        .setDescription(`Le panel **${panel.panelTitle}** a été supprimé avec succès.`)
        .setColor(0x00FF00)
        .setTimestamp();

      const backRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`ticket_delete_panel_${userId}`)
            .setLabel('Retour à la Suppression')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔙')
        );

      await interaction.update({ 
        embeds: [successEmbed], 
        components: [backRow]
      });

    } catch (error) {
      console.error('Error deleting panel:', error);
      await interaction.reply({
        content: 'Erreur lors de la suppression du panel.',
        flags: MessageFlags.Ephemeral
      });
    }

  } catch (error) {
    console.error('Error handling panel delete confirm:', error);
    await interaction.reply({ 
      content: 'Une erreur est survenue.', 
      flags: MessageFlags.Ephemeral 
    });
  }
}
