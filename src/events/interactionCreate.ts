import { Events } from 'discord.js';
import { ClientWithCommands } from '../index';
import { handleRoleButtons, handleTicketButtons, handleCloseTicket, handleConfirmClose } from '../utils/buttonHandler';

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction: any) {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const client = interaction.client as ClientWithCommands;
      const command = client.commands.get(interaction.commandName);

      if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        const errorMessage = 'There was an error while executing this command!';
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: errorMessage, ephemeral: true });
        } else {
          await interaction.reply({ content: errorMessage, ephemeral: true });
        }
      }
    }
    
    // Handle button interactions
    else if (interaction.isButton()) {
      try {
        if (interaction.customId.startsWith('approve_role_') || interaction.customId.startsWith('deny_role_')) {
          await handleRoleButtons(interaction);
        } else if (interaction.customId.startsWith('create_ticket_')) {
          await handleTicketButtons(interaction);
        } else if (interaction.customId.startsWith('close_ticket_')) {
          await handleCloseTicket(interaction);
        } else if (interaction.customId.startsWith('confirm_close_')) {
          await handleConfirmClose(interaction);
        } else if (interaction.customId === 'cancel_close') {
          await interaction.update({ content: 'Ticket close cancelled.', components: [] });
        }
      } catch (error) {
        console.error('Button interaction error:', error);
        const errorMessage = 'There was an error while processing this button!';
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: errorMessage, ephemeral: true });
        } else {
          await interaction.reply({ content: errorMessage, ephemeral: true });
        }
      }
    }
  },
};
