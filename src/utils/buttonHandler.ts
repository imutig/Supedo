import { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ChannelType,
  PermissionFlagsBits,
  MessageFlags 
} from 'discord.js';
import { RoleRequestDB, TicketDB, RoleGroupDB, TicketCategoryDB } from '../utils/database';

export async function handleRoleButtons(interaction: any) {
  const [action, , userId, roleId] = interaction.customId.split('_');
  
  // Check if user has permission to manage roles
  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
    return interaction.reply({ content: 'Vous n\'avez pas la permission de gérer les demandes de rôles !', flags: MessageFlags.Ephemeral });
  }

  const request = await RoleRequestDB.findByUserAndRole(userId, roleId);
  
  if (!request) {
    return interaction.reply({ content: 'Cette demande de rôle n\'existe plus !', flags: MessageFlags.Ephemeral });
  }

  const guild = interaction.guild;
  const member = await guild.members.fetch(userId);
  const role = await guild.roles.fetch(roleId);

  if (!member || !role) {
    return interaction.reply({ content: 'Membre ou rôle introuvable !', flags: MessageFlags.Ephemeral });
  }

  if (action === 'approve') {
    try {
      await member.roles.add(role);
      
      // Update request status
      await RoleRequestDB.updateStatus(request.id, 'approved', interaction.user.id);

      const embed = new EmbedBuilder()
        .setTitle('Demande de Rôle Approuvée')
        .setDescription(`${member.user.tag} a reçu le rôle **${role.name}**.`)
        .setColor(0x00FF00)
        .addFields(
          { name: 'Approuvé par', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Utilisateur', value: `<@${member.user.id}>`, inline: true },
          { name: 'Rôle', value: `<@&${role.id}>`, inline: true }
        )
        .setTimestamp();

      await interaction.update({ embeds: [embed], components: [] });

      // DM the user
      try {
        await member.send(`Votre demande pour le rôle **${role.name}** dans **${guild.name}** a été approuvée !`);
      } catch (error) {
        // User has DMs disabled
      }
    } catch (error) {
      await interaction.reply({ content: 'Échec de l\'ajout du rôle à l\'utilisateur !', flags: MessageFlags.Ephemeral });
    }
  } else if (action === 'deny') {
    await RoleRequestDB.updateStatus(request.id, 'denied', interaction.user.id);

    const embed = new EmbedBuilder()
      .setTitle('Demande de Rôle Refusée')
      .setDescription(`La demande de ${member.user.tag} pour le rôle **${role.name}** a été refusée.`)
      .setColor(0xFF0000)
      .addFields(
        { name: 'Refusé par', value: `<@${interaction.user.id}>`, inline: true },
        { name: 'Utilisateur', value: `<@${member.user.id}>`, inline: true },
        { name: 'Rôle', value: `<@&${role.id}>`, inline: true }
      )
      .setTimestamp();

    await interaction.update({ embeds: [embed], components: [] });

    // DM the user
    try {
      await member.send(`Votre demande pour le rôle **${role.name}** dans **${guild.name}** a été refusée.`);
    } catch (error) {
      // User has DMs disabled
    }
  }
}

export async function handleTicketButtons(interaction: any) {
  const [, , categoryKey] = interaction.customId.split('_');
  const guild = interaction.guild;
  const member = interaction.member;

  // Defer the reply immediately to avoid timeout
  await interaction.deferReply({ ephemeral: true });

  // Check if user already has an open ticket
  const existingTickets = await TicketDB.findOpenByUser(member.user.id, guild.id);

  if (existingTickets.length > 0) {
    return interaction.editReply({ 
      content: `Vous avez déjà un ticket ouvert: <#${existingTickets[0].channelId}>` 
    });
  }

  // Get the custom category from database
  const ticketCategory = await TicketCategoryDB.findByCategoryKey(guild.id, categoryKey);
  
  if (!ticketCategory) {
    return interaction.editReply({ 
      content: 'Type de ticket introuvable!' 
    });
  }

  // Find or create tickets category using the custom Discord category
  let category;
  if (ticketCategory.discordCategoryId) {
    try {
      category = await guild.channels.fetch(ticketCategory.discordCategoryId);
      if (!category || category.type !== ChannelType.GuildCategory) {
        // Fallback if custom category doesn't exist anymore
        category = guild.channels.cache.find((c: any) => c.name === 'Tickets' && c.type === ChannelType.GuildCategory);
      }
    } catch (error) {
      console.error('Error fetching custom Discord category:', error);
      category = guild.channels.cache.find((c: any) => c.name === 'Tickets' && c.type === ChannelType.GuildCategory);
    }
  } else {
    category = guild.channels.cache.find((c: any) => c.name === 'Tickets' && c.type === ChannelType.GuildCategory);
  }
  
  if (!category) {
    try {
      category = await guild.channels.create({
        name: 'Tickets',
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
        ],
      });
    } catch (error) {
      return interaction.editReply({ content: 'Impossible de créer la catégorie tickets!' });
    }
  }

  // Create ticket channel
  const ticketId = `ticket-${categoryKey}-${Date.now()}`;
  
  try {
    const ticketChannel = await guild.channels.create({
      name: ticketId,
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: member.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
        // Add permissions for staff roles here
      ],
    });

    // Store ticket in database
    await TicketDB.create({
      ticketId,
      userId: member.user.id,
      guildId: guild.id,
      channelId: ticketChannel.id,
      ticketType: categoryKey,
      categoryId: category.id
    });

    // Create ticket embed with custom category information
    const defaultDescription = `Bonjour ${member.user.tag}! Veuillez décrire votre problème et quelqu'un vous aidera bientôt.`;
    const embedDescription = ticketCategory.openMessage || defaultDescription;
    
    const ticketEmbed = new EmbedBuilder()
      .setTitle(`${ticketCategory.categoryName} - Ticket`)
      .setDescription(embedDescription)
      .setColor(0x0099FF)
      .addFields(
        { name: 'Type de Ticket', value: ticketCategory.categoryName, inline: true },
        { name: 'Créé par', value: `<@${member.user.id}>`, inline: true },
        { name: 'Créé le', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
      )
      .setTimestamp();

    // Close button
    const closeButton = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`close_ticket_${ticketId}`)
          .setLabel('Fermer le Ticket')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🔒')
      );

    await ticketChannel.send({ 
      content: `<@${member.user.id}>`, 
      embeds: [ticketEmbed], 
      components: [closeButton] 
    });

    await interaction.editReply({ 
      content: `Ticket créé! Rendez-vous dans <#${ticketChannel.id}>` 
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    await interaction.editReply({ content: 'Impossible de créer le ticket!' });
  }
}

export async function handleCloseTicket(interaction: any) {
  const [, , ticketId] = interaction.customId.split('_');
  const ticket = await TicketDB.findByTicketId(ticketId);

  if (!ticket) {
    return interaction.reply({ content: 'Ticket not found!', flags: MessageFlags.Ephemeral });
  }

  // Check if user has permission to close ticket
  const canClose = interaction.user.id === ticket.userId || 
                   interaction.member.permissions.has(PermissionFlagsBits.ManageChannels);

  if (!canClose) {
    return interaction.reply({ content: 'You do not have permission to close this ticket!', flags: MessageFlags.Ephemeral });
  }

  // Confirmation buttons
  const confirmRow = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`confirm_close_${ticketId}`)
        .setLabel('Yes, Close')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('cancel_close')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary)
    );

  await interaction.reply({
    content: 'Are you sure you want to close this ticket?',
    components: [confirmRow],
    flags: MessageFlags.Ephemeral
  });
}

export async function handleConfirmClose(interaction: any) {
  const [, , ticketId] = interaction.customId.split('_');
  const ticket = await TicketDB.findByTicketId(ticketId);

  if (!ticket) {
    return interaction.reply({ content: 'Ticket not found!', flags: MessageFlags.Ephemeral });
  }

  try {
    const channel = interaction.guild.channels.cache.get(ticket.channelId);
    if (channel) {
      await channel.delete();
    }

    // Update ticket status
    await TicketDB.closeTicket(ticketId, interaction.user.id);

    // The channel will be deleted, so we don't need to reply
  } catch (error) {
    console.error('Error closing ticket:', error);
    await interaction.reply({ content: 'Failed to close ticket!', flags: MessageFlags.Ephemeral });
  }
}

export async function handleRoleGroupSelection(interaction: any) {
  try {
    const [, , , userId, groupId] = interaction.customId.split('_');
    const selectedRoleId = interaction.values[0];
    
    // Check if the user is authorized to make this selection
    if (interaction.user.id !== userId) {
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce menu !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    const guild = interaction.guild;
    const member = interaction.member;
    const role = guild.roles.cache.get(selectedRoleId);

    if (!role) {
      return interaction.reply({ 
        content: 'Le rôle sélectionné n\'existe plus !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    // Check if user already has the role
    if (member.roles.cache.has(role.id)) {
      return interaction.reply({ 
        content: 'Vous avez déjà ce rôle !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    // Check if user already has a pending request for this role
    const existingRequest = await RoleRequestDB.findByUserAndRole(member.user.id, role.id);
    if (existingRequest && existingRequest.status === 'pending') {
      return interaction.reply({ 
        content: 'Vous avez déjà une demande en attente pour ce rôle !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    // Create role request embed
    const requestEmbed = new EmbedBuilder()
      .setTitle('Demande de Rôle (Groupe)')
      .setDescription(`${member.user.tag} a demandé le rôle **${role.name}** depuis un groupe de rôles.`)
      .setColor(role.color || 0x0099FF)
      .setThumbnail(member.user.displayAvatarURL())
      .addFields(
        { name: 'Utilisateur', value: `<@${member.user.id}>`, inline: true },
        { name: 'Rôle', value: `<@&${role.id}>`, inline: true },
        { name: 'Demandé le', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
      )
      .setTimestamp();

    // Create buttons
    const actionRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`approve_role_${member.user.id}_${role.id}`)
          .setLabel('Approuver')
          .setStyle(ButtonStyle.Success)
          .setEmoji('✅'),
        new ButtonBuilder()
          .setCustomId(`deny_role_${member.user.id}_${role.id}`)
          .setLabel('Refuser')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('❌')
      );

    // Store request in database
    await RoleRequestDB.create({
      userId: member.user.id,
      roleId: role.id,
      guildId: guild.id
    });

    // Send the request in the same channel where the command was used
    await interaction.channel.send({ embeds: [requestEmbed], components: [actionRow] });

    // Update the original message to disable the select menu
    await interaction.update({ 
      content: `✅ Votre demande pour le rôle **${role.name}** a été soumise pour approbation !`,
      embeds: [],
      components: []
    });

  } catch (error) {
    console.error('Error handling role group selection:', error);
    
    if (!interaction.replied && !interaction.deferred) {
      try {
        await interaction.reply({ 
          content: 'Une erreur est survenue lors du traitement de votre sélection.', 
          flags: MessageFlags.Ephemeral 
        });
      } catch (replyError) {
        console.error('Failed to send error reply:', replyError);
      }
    }
  }
}
