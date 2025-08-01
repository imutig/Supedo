import { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ChannelType,
  PermissionFlagsBits 
} from 'discord.js';
import { TicketSetupDB } from '../utils/database';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Setup the ticket system')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Channel to send the ticket creation message')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true))
    .addStringOption(option =>
      option.setName('title')
        .setDescription('Title for the ticket creation embed')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('description')
        .setDescription('Description for the ticket creation embed')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('color')
        .setDescription('Hex color for the embed (e.g., #0099FF)')
        .setRequired(false)),

  async execute(interaction: any) {
    const channel = interaction.options.getChannel('channel');
    const title = interaction.options.getString('title') || 'Create a Ticket';
    const description = interaction.options.getString('description') || 'Click the button below to create a support ticket.';
    const colorHex = interaction.options.getString('color') || '#0099FF';
    
    // Validate color
    let color = 0x0099FF;
    if (colorHex.startsWith('#')) {
      const hex = colorHex.slice(1);
      if (hex.length === 6 && /^[0-9A-F]{6}$/i.test(hex)) {
        color = parseInt(hex, 16);
      }
    }

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(color)
      .setTimestamp();

    // Create default ticket buttons - you can extend this to be more customizable
    const actionRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('create_ticket_general')
          .setLabel('General Support')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🎫'),
        new ButtonBuilder()
          .setCustomId('create_ticket_technical')
          .setLabel('Technical Issue')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('⚙️'),
        new ButtonBuilder()
          .setCustomId('create_ticket_billing')
          .setLabel('Billing')
          .setStyle(ButtonStyle.Success)
          .setEmoji('💳')
      );

    try {
      const message = await channel.send({ embeds: [embed], components: [actionRow] });
      
      // Store setup in database
      await TicketSetupDB.create({
        guildId: interaction.guild.id,
        channelId: channel.id,
        messageId: message.id,
        embedTitle: title,
        embedDescription: description,
        embedColor: colorHex,
        buttonsConfig: [
          { id: 'create_ticket_general', label: 'General Support', emoji: '🎫', style: ButtonStyle.Primary },
          { id: 'create_ticket_technical', label: 'Technical Issue', emoji: '⚙️', style: ButtonStyle.Secondary },
          { id: 'create_ticket_billing', label: 'Billing', emoji: '💳', style: ButtonStyle.Success }
        ]
      });

      const successEmbed = new EmbedBuilder()
        .setTitle('Ticket System Setup Complete')
        .setDescription(`Ticket creation message has been sent to ${channel}`)
        .addFields(
          { name: 'Channel', value: `<#${channel.id}>`, inline: true },
          { name: 'Message ID', value: message.id, inline: true }
        )
        .setColor(0x00FF00)
        .setTimestamp();

      await interaction.reply({ embeds: [successEmbed], ephemeral: true });
    } catch (error) {
      console.error('Error setting up ticket system:', error);
      await interaction.reply({ 
        content: 'There was an error setting up the ticket system. Please check my permissions.', 
        ephemeral: true 
      });
    }
  },
};
