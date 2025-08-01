import { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ChannelType,
  PermissionFlagsBits 
} from 'discord.js';
import { RoleRequestDB, TicketDB } from '../utils/database';

export async function handleRoleButtons(interaction: any) {
  const [action, , userId, roleId] = interaction.customId.split('_');
  
  // Check if user has permission to manage roles
  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
    return interaction.reply({ content: 'You do not have permission to manage role requests!', ephemeral: true });
  }

  const request = await RoleRequestDB.findByUserAndRole(userId, roleId);
  
  if (!request) {
    return interaction.reply({ content: 'This role request no longer exists!', ephemeral: true });
  }

  const guild = interaction.guild;
  const member = await guild.members.fetch(userId);
  const role = await guild.roles.fetch(roleId);

  if (!member || !role) {
    return interaction.reply({ content: 'Member or role not found!', ephemeral: true });
  }

  if (action === 'approve') {
    try {
      await member.roles.add(role);
      
      // Update request status
      await RoleRequestDB.updateStatus(request.id, 'approved', interaction.user.id);

      const embed = new EmbedBuilder()
        .setTitle('Role Request Approved')
        .setDescription(`${member.user.tag} has been given the **${role.name}** role.`)
        .setColor(0x00FF00)
        .addFields(
          { name: 'Approved by', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'User', value: `<@${member.user.id}>`, inline: true },
          { name: 'Role', value: `<@&${role.id}>`, inline: true }
        )
        .setTimestamp();

      await interaction.update({ embeds: [embed], components: [] });

      // DM the user
      try {
        await member.send(`Your request for the **${role.name}** role in **${guild.name}** has been approved!`);
      } catch (error) {
        // User has DMs disabled
      }
    } catch (error) {
      await interaction.reply({ content: 'Failed to add role to user!', ephemeral: true });
    }
  } else if (action === 'deny') {
    await RoleRequestDB.updateStatus(request.id, 'denied', interaction.user.id);

    const embed = new EmbedBuilder()
      .setTitle('Role Request Denied')
      .setDescription(`${member.user.tag}'s request for the **${role.name}** role has been denied.`)
      .setColor(0xFF0000)
      .addFields(
        { name: 'Denied by', value: `<@${interaction.user.id}>`, inline: true },
        { name: 'User', value: `<@${member.user.id}>`, inline: true },
        { name: 'Role', value: `<@&${role.id}>`, inline: true }
      )
      .setTimestamp();

    await interaction.update({ embeds: [embed], components: [] });

    // DM the user
    try {
      await member.send(`Your request for the **${role.name}** role in **${guild.name}** has been denied.`);
    } catch (error) {
      // User has DMs disabled
    }
  }
}

export async function handleTicketButtons(interaction: any) {
  const [, , type] = interaction.customId.split('_');
  const guild = interaction.guild;
  const member = interaction.member;

  // Check if user already has an open ticket
  const existingTickets = await TicketDB.findOpenByUser(member.user.id, guild.id);

  if (existingTickets.length > 0) {
    return interaction.reply({ 
      content: `You already have an open ticket: <#${existingTickets[0].channelId}>`, 
      ephemeral: true 
    });
  }

  // Find or create tickets category
  let category = guild.channels.cache.find((c: any) => c.name === 'Tickets' && c.type === ChannelType.GuildCategory);
  
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
      return interaction.reply({ content: 'Failed to create tickets category!', ephemeral: true });
    }
  }

  // Create ticket channel
  const ticketId = `ticket-${type}-${Date.now()}`;
  
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
      ticketType: type,
      categoryId: category.id
    });

    // Create ticket embed
    const ticketEmbed = new EmbedBuilder()
      .setTitle(`${type.charAt(0).toUpperCase() + type.slice(1)} Support Ticket`)
      .setDescription(`Hello ${member.user.tag}! Please describe your issue and someone will help you soon.`)
      .setColor(0x0099FF)
      .addFields(
        { name: 'Ticket Type', value: type, inline: true },
        { name: 'Created by', value: `<@${member.user.id}>`, inline: true },
        { name: 'Created at', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
      )
      .setTimestamp();

    // Close button
    const closeButton = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`close_ticket_${ticketId}`)
          .setLabel('Close Ticket')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🔒')
      );

    await ticketChannel.send({ 
      content: `<@${member.user.id}>`, 
      embeds: [ticketEmbed], 
      components: [closeButton] 
    });

    await interaction.reply({ 
      content: `Ticket created! Please go to <#${ticketChannel.id}>`, 
      ephemeral: true 
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    await interaction.reply({ content: 'Failed to create ticket!', ephemeral: true });
  }
}

export async function handleCloseTicket(interaction: any) {
  const [, , ticketId] = interaction.customId.split('_');
  const ticket = await TicketDB.findByTicketId(ticketId);

  if (!ticket) {
    return interaction.reply({ content: 'Ticket not found!', ephemeral: true });
  }

  // Check if user has permission to close ticket
  const canClose = interaction.user.id === ticket.userId || 
                   interaction.member.permissions.has(PermissionFlagsBits.ManageChannels);

  if (!canClose) {
    return interaction.reply({ content: 'You do not have permission to close this ticket!', ephemeral: true });
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
    ephemeral: true
  });
}

export async function handleConfirmClose(interaction: any) {
  const [, , ticketId] = interaction.customId.split('_');
  const ticket = await TicketDB.findByTicketId(ticketId);

  if (!ticket) {
    return interaction.reply({ content: 'Ticket not found!', ephemeral: true });
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
    await interaction.reply({ content: 'Failed to close ticket!', ephemeral: true });
  }
}
