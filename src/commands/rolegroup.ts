import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rolegroup')
    .setDescription('Manage role groups')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Create a new role group')
        .addStringOption(option =>
          option.setName('name')
            .setDescription('Name of the role group')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('roles')
            .setDescription('Comma-separated list of role names to include in this group')
            .setRequired(true))
        .addRoleOption(option =>
          option.setName('required_role')
            .setDescription('Role required to approve requests for this group')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all role groups'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('delete')
        .setDescription('Delete a role group')
        .addStringOption(option =>
          option.setName('name')
            .setDescription('Name of the role group to delete')
            .setRequired(true))),

  async execute(interaction: any) {
    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand === 'create') {
      const groupName = interaction.options.getString('name');
      const rolesString = interaction.options.getString('roles');
      const requiredRole = interaction.options.getRole('required_role');
      
      const guild = interaction.guild;
      const roleNames = rolesString.split(',').map((name: string) => name.trim());
      const validRoles = [];
      const invalidRoles = [];

      // Validate roles exist
      for (const roleName of roleNames) {
        const role = guild.roles.cache.find((r: any) => r.name.toLowerCase() === roleName.toLowerCase());
        if (role) {
          validRoles.push(role);
        } else {
          invalidRoles.push(roleName);
        }
      }

      if (invalidRoles.length > 0) {
        return interaction.reply({
          content: `The following roles were not found: ${invalidRoles.join(', ')}`,
          ephemeral: true
        });
      }

      // Store role group (in a real implementation, save to database)
      const roleGroup = {
        name: groupName,
        roles: validRoles.map(r => ({ id: r.id, name: r.name })),
        requiredRole: requiredRole ? { id: requiredRole.id, name: requiredRole.name } : null,
        guildId: guild.id
      };

      const embed = new EmbedBuilder()
        .setTitle('Role Group Created')
        .setDescription(`Successfully created role group: **${groupName}**`)
        .addFields(
          { 
            name: 'Roles', 
            value: validRoles.map(r => `<@&${r.id}>`).join(', '), 
            inline: false 
          },
          {
            name: 'Required Role for Approval',
            value: requiredRole ? `<@&${requiredRole.id}>` : 'Manage Roles permission',
            inline: false
          }
        )
        .setColor(0x00FF00)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
    
    else if (subcommand === 'list') {
      // In a real implementation, fetch from database
      const embed = new EmbedBuilder()
        .setTitle('Role Groups')
        .setDescription('No role groups configured yet.')
        .setColor(0x0099FF)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
    
    else if (subcommand === 'delete') {
      const groupName = interaction.options.getString('name');
      
      // In a real implementation, delete from database
      const embed = new EmbedBuilder()
        .setTitle('Role Group Deleted')
        .setDescription(`Role group **${groupName}** has been deleted.`)
        .setColor(0xFF0000)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  },
};
