import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import { RoleRequestDB } from '../utils/database';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('role')
    .setDescription('Request a role from the server')
    .addStringOption(option =>
      option.setName('role')
        .setDescription('The role you want to request')
        .setRequired(true)
        .setAutocomplete(true)),

  async execute(interaction: any) {
    const roleName = interaction.options.getString('role');
    const member = interaction.member;
    const guild = interaction.guild;

    // Check if role exists
    const role = guild.roles.cache.find((r: any) => r.name.toLowerCase() === roleName.toLowerCase());
    if (!role) {
      return interaction.reply({ content: 'That role does not exist!', ephemeral: true });
    }

    // Check if user already has the role
    if (member.roles.cache.has(role.id)) {
      return interaction.reply({ content: 'You already have this role!', ephemeral: true });
    }

    // Check if role is manageable
    if (role.managed || role.name === '@everyone') {
      return interaction.reply({ content: 'This role cannot be requested!', ephemeral: true });
    }

    // Check if user already has a pending request for this role
    const existingRequest = await RoleRequestDB.findByUserAndRole(member.user.id, role.id);
    if (existingRequest && existingRequest.status === 'pending') {
      return interaction.reply({ content: 'You already have a pending request for this role!', ephemeral: true });
    }

    // Create role request embed
    const requestEmbed = new EmbedBuilder()
      .setTitle('Role Request')
      .setDescription(`${member.user.tag} has requested the **${role.name}** role.`)
      .setColor(role.color || 0x0099FF)
      .setThumbnail(member.user.displayAvatarURL())
      .addFields(
        { name: 'User', value: `<@${member.user.id}>`, inline: true },
        { name: 'Role', value: `<@&${role.id}>`, inline: true },
        { name: 'Requested at', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
      )
      .setTimestamp();

    // Create buttons
    const actionRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`approve_role_${member.user.id}_${role.id}`)
          .setLabel('Approve')
          .setStyle(ButtonStyle.Success)
          .setEmoji('✅'),
        new ButtonBuilder()
          .setCustomId(`deny_role_${member.user.id}_${role.id}`)
          .setLabel('Deny')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('❌')
      );

    // Store request in database
    await RoleRequestDB.create({
      userId: member.user.id,
      roleId: role.id,
      guildId: guild.id
    });

    // Find a channel to send the request (you might want to configure this)
    const logChannel = guild.channels.cache.find((c: any) => c.name === 'role-requests' || c.name === 'mod-log');
    if (logChannel && logChannel.isTextBased()) {
      await logChannel.send({ embeds: [requestEmbed], components: [actionRow] });
    }

    await interaction.reply({ 
      content: `Your request for the **${role.name}** role has been submitted for approval!`, 
      ephemeral: true 
    });
  },
};
