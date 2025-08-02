import { Events, MessageFlags } from 'discord.js';
import { ClientWithCommands } from '../index';
import { handleRoleButtons, handleTicketButtons, handleCloseTicket, handleConfirmClose, handleRoleGroupSelection } from '../utils/buttonHandler';
import { handleRoleRequest, handleIndividualRole, handleRoleGroupRequest, handleRoleBack, handleIndividualRoleSelection, handleRoleRemove, handleRoleList, handleRoleGroupManage, handleRoleRemoveSelect, handleRoleGroupCreate, handleRoleGroupList, handleRoleGroupDelete, handleRoleGroupDeleteSelect, handleRoleGroupCreateSelect, handleRolePending, handleRoleGroupEdit, handleRoleGroupEditSelect, handleRoleGroupEditName, handleRoleGroupEditDesc, handleRoleGroupNameInput, handleRoleGroupDescInput, handleGroupApproval, handleGroupDenial, handlePendingDelete, handlePendingClear, handlePendingRefresh } from '../utils/roleMenuHandler';
import { handleTicketCreatePanel, handleTicketPanelChannel, handleTicketPanelSetup, handleTicketBack, handleTicketManageCategories, handleTicketCustomize, handleTicketStats, handleTicketDeletePanel, handleTicketListPanels, handleCategoryCreate, handleCategoryCreateModal, handleCategoryEdit, handleCategoryDelete, handleCategoryEditSelect, handleCategoryEditModal, handleCategoryDeleteSelect, handleCategoryDeleteConfirm, handleCategorySelectDiscord, handleCategoryStyleSelect, handleCategoryEditStyleSelect, handleCategoryEditDiscordSelect, handlePanelCustomizeSelect, handlePanelCustomizeModal, handlePanelDeleteSelect, handlePanelDeleteConfirm } from '../utils/ticketMenuHandler';

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
        console.error('Command execution error:', error);
        const errorMessage = 'There was an error while executing this command!';
        
        try {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: errorMessage, flags: MessageFlags.Ephemeral });
          } else {
            await interaction.reply({ content: errorMessage, flags: MessageFlags.Ephemeral });
          }
        } catch (replyError) {
          console.error('Failed to send error message to user:', replyError);
        }
      }
    }
    
    // Handle button interactions
    else if (interaction.isButton()) {
      try {
        // Role management buttons
        if (interaction.customId.startsWith('role_request_')) {
          await handleRoleRequest(interaction);
        } else if (interaction.customId.startsWith('role_individual_')) {
          await handleIndividualRole(interaction);
        } else if (interaction.customId.startsWith('rolegroup_request_')) {
          await handleRoleGroupRequest(interaction);
        } else if (interaction.customId.startsWith('role_back_')) {
          await handleRoleBack(interaction);
        } else if (interaction.customId.startsWith('role_remove_')) {
          await handleRoleRemove(interaction);
        } else if (interaction.customId.startsWith('role_list_')) {
          await handleRoleList(interaction);
        } else if (interaction.customId.startsWith('rolegroup_manage_')) {
          await handleRoleGroupManage(interaction);
        } else if (interaction.customId.startsWith('rolegroup_create_')) {
          await handleRoleGroupCreate(interaction);
        } else if (interaction.customId.startsWith('rolegroup_list_')) {
          await handleRoleGroupList(interaction);
        } else if (interaction.customId.startsWith('rolegroup_delete_')) {
          await handleRoleGroupDelete(interaction);
        } else if (interaction.customId.startsWith('role_pending_')) {
          await handleRolePending(interaction);
        } else if (interaction.customId.startsWith('rolegroup_edit_')) {
          await handleRoleGroupEdit(interaction);
        } else if (interaction.customId.startsWith('rolegroup_editname_')) {
          await handleRoleGroupEditName(interaction);
        } else if (interaction.customId.startsWith('rolegroup_editdesc_')) {
          await handleRoleGroupEditDesc(interaction);
        }
        // Existing role approval/denial buttons
        else if (interaction.customId.startsWith('approve_role_') || interaction.customId.startsWith('deny_role_')) {
          await handleRoleButtons(interaction);
        } 
        // Group approval/denial buttons
        else if (interaction.customId.startsWith('approve_group_')) {
          await handleGroupApproval(interaction);
        } else if (interaction.customId.startsWith('deny_group_')) {
          await handleGroupDenial(interaction);
        } else if (interaction.customId.startsWith('pending_clear_')) {
          await handlePendingClear(interaction);
        } else if (interaction.customId.startsWith('pending_refresh_')) {
          await handlePendingRefresh(interaction);
        } 
        // Ticket management buttons
        else if (interaction.customId.startsWith('ticket_create_panel_')) {
          await handleTicketCreatePanel(interaction);
        } else if (interaction.customId.startsWith('ticket_manage_categories_')) {
          await handleTicketManageCategories(interaction);
        } else if (interaction.customId.startsWith('ticket_customize_')) {
          await handleTicketCustomize(interaction);
        } else if (interaction.customId.startsWith('ticket_stats_')) {
          await handleTicketStats(interaction);
        } else if (interaction.customId.startsWith('ticket_delete_panel_')) {
          await handleTicketDeletePanel(interaction);
        } else if (interaction.customId.startsWith('ticket_list_panels_')) {
          await handleTicketListPanels(interaction);
        } else if (interaction.customId.startsWith('ticket_back_')) {
          await handleTicketBack(interaction);
        } else if (interaction.customId.startsWith('category_create_')) {
          await handleCategoryCreate(interaction);
        } else if (interaction.customId.startsWith('category_edit_')) {
          await handleCategoryEdit(interaction);
        } else if (interaction.customId.startsWith('category_delete_') && !interaction.customId.includes('confirm')) {
          await handleCategoryDelete(interaction);
        } else if (interaction.customId.startsWith('category_delete_confirm_')) {
          await handleCategoryDeleteConfirm(interaction);
        } else if (interaction.customId.startsWith('panel_delete_confirm_')) {
          await handlePanelDeleteConfirm(interaction);
        } 
        // Ticket buttons
        else if (interaction.customId.startsWith('create_ticket_')) {
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
        
        try {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: errorMessage, flags: MessageFlags.Ephemeral });
          } else {
            await interaction.reply({ content: errorMessage, flags: MessageFlags.Ephemeral });
          }
        } catch (replyError) {
          console.error('Failed to send button error message to user:', replyError);
        }
      }
    }

    // Handle string select menu interactions
    else if (interaction.isStringSelectMenu()) {
      try {
        if (interaction.customId.startsWith('role_group_select_')) {
          await handleRoleGroupSelection(interaction);
        } else if (interaction.customId.startsWith('role_select_')) {
          // Handle individual role selection from the new menu
          await handleIndividualRoleSelection(interaction);
        } else if (interaction.customId.startsWith('role_remove_select_')) {
          await handleRoleRemoveSelect(interaction);
        } else if (interaction.customId.startsWith('rolegroup_delete_select_')) {
          await handleRoleGroupDeleteSelect(interaction);
        } else if (interaction.customId.startsWith('rolegroup_create_select_')) {
          await handleRoleGroupCreateSelect(interaction);
        } else if (interaction.customId.startsWith('rolegroup_edit_select_')) {
          await handleRoleGroupEditSelect(interaction);
        } else if (interaction.customId.startsWith('rolegroup_nameinput_')) {
          // These are now handled by modal submissions, remove these lines
        } else if (interaction.customId.startsWith('rolegroup_descinput_')) {
          // These are now handled by modal submissions, remove these lines
        } else if (interaction.customId.startsWith('pending_delete_')) {
          await handlePendingDelete(interaction);
        } else if (interaction.customId.startsWith('ticket_panel_channel_')) {
          await handleTicketPanelChannel(interaction);
        } else if (interaction.customId.startsWith('category_edit_select_')) {
          await handleCategoryEditSelect(interaction);
        } else if (interaction.customId.startsWith('category_delete_select_')) {
          await handleCategoryDeleteSelect(interaction);
        } else if (interaction.customId.startsWith('category_select_discord_')) {
          await handleCategorySelectDiscord(interaction);
        } else if (interaction.customId.startsWith('category_style_select_')) {
          await handleCategoryStyleSelect(interaction);
        } else if (interaction.customId.startsWith('category_edit_style_select_')) {
          await handleCategoryEditStyleSelect(interaction);
        } else if (interaction.customId.startsWith('category_edit_discord_select_')) {
          await handleCategoryEditDiscordSelect(interaction);
        } else if (interaction.customId.startsWith('panel_customize_select_')) {
          await handlePanelCustomizeSelect(interaction);
        } else if (interaction.customId.startsWith('panel_delete_select_')) {
          await handlePanelDeleteSelect(interaction);
        }
      } catch (error) {
        console.error('Select menu interaction error:', error);
        const errorMessage = 'There was an error while processing this selection!';
        
        try {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: errorMessage, flags: MessageFlags.Ephemeral });
          } else {
            await interaction.reply({ content: errorMessage, flags: MessageFlags.Ephemeral });
          }
        } catch (replyError) {
          console.error('Failed to send select menu error message to user:', replyError);
        }
      }
    }

    // Handle modal submissions
    else if (interaction.isModalSubmit()) {
      try {
        if (interaction.customId.startsWith('rolegroup_nameinput_')) {
          await handleRoleGroupNameInput(interaction);
        } else if (interaction.customId.startsWith('rolegroup_descinput_')) {
          await handleRoleGroupDescInput(interaction);
        } else if (interaction.customId.startsWith('ticket_panel_setup_')) {
          await handleTicketPanelSetup(interaction);
        } else if (interaction.customId.startsWith('category_create_modal_')) {
          await handleCategoryCreateModal(interaction);
        } else if (interaction.customId.startsWith('category_edit_modal_')) {
          await handleCategoryEditModal(interaction);
        } else if (interaction.customId.startsWith('panel_customize_modal_')) {
          await handlePanelCustomizeModal(interaction);
        }
      } catch (error) {
        console.error('Modal submission error:', error);
        const errorMessage = 'There was an error while processing this form!';
        
        try {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: errorMessage, flags: MessageFlags.Ephemeral });
          } else {
            await interaction.reply({ content: errorMessage, flags: MessageFlags.Ephemeral });
          }
        } catch (replyError) {
          console.error('Failed to send modal error message to user:', replyError);
        }
      }
    }
  },
};
