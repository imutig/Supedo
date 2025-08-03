import { MessageFlags } from 'discord.js';
import { 
  handleRoleButtons, handleTicketButtons, handleCloseTicket, handleConfirmClose, 
  handleRoleGroupSelection, handleRenameTicket, handleTicketRenameModal, handleInfoButtons 
} from './buttonHandler';
import { 
  handleRoleRequest, handleIndividualRole, handleRoleGroupRequest, handleRoleBack, 
  handleIndividualRoleSelection, handleRoleRemove, handleRoleList, handleRoleGroupManage, 
  handleRoleRemoveSelect, handleRoleGroupCreate, handleRoleGroupList, handleRoleGroupDelete, 
  handleRoleGroupDeleteSelect, handleRoleGroupCreateSelect, handleRolePending, 
  handleRoleGroupEdit, handleRoleGroupEditSelect, handleRoleGroupEditName, 
  handleRoleGroupEditDesc, handleRoleGroupNameInput, handleRoleGroupDescInput, 
  handleGroupApproval, handleGroupDenial, handlePendingDelete, handlePendingClear, 
  handlePendingRefresh, handleApproveRemoval, handleDenyRemoval, handleRoleSearchModal 
} from './roleMenuHandler';
import { 
  handleTicketCreatePanel, handleTicketPanelChannel, handleTicketPanelSetup, handleTicketBack, 
  handleTicketManageCategories, handleTicketCustomize, handleTicketStats, handleTicketDeletePanel, 
  handleTicketListPanels, handleCategoryCreate, handleCategoryCreateModal, handleCategoryEdit, 
  handleCategoryDelete, handleCategoryEditSelect, handleCategoryEditModal, handleCategoryDeleteSelect, 
  handleCategoryDeleteConfirm, handleCategorySelectDiscord, handleCategoryStyleSelect, 
  handleCategoryEditStyleSelect, handleCategoryEditDiscordSelect, handlePanelCustomizeSelect, 
  handlePanelCustomizeModal, handlePanelDeleteSelect, handlePanelDeleteConfirm 
} from './ticketMenuHandler';

const buttonRoutes = new Map([
  ['role_request_', handleRoleRequest],
  ['role_individual_', handleIndividualRole],
  ['rolegroup_request_', handleRoleGroupRequest],
  ['role_back_', handleRoleBack],
  ['role_remove_', handleRoleRemove],
  ['role_list_', handleRoleList],
  ['rolegroup_manage_', handleRoleGroupManage],
  ['rolegroup_create_', handleRoleGroupCreate],
  ['rolegroup_list_', handleRoleGroupList],
  ['rolegroup_delete_', handleRoleGroupDelete],
  ['role_pending_', handleRolePending],
  ['rolegroup_edit_', handleRoleGroupEdit],
  ['rolegroup_editname_', handleRoleGroupEditName],
  ['rolegroup_editdesc_', handleRoleGroupEditDesc],
  ['approve_role_', handleRoleButtons],
  ['deny_role_', handleRoleButtons],
  ['approve_removal_', handleApproveRemoval],
  ['deny_removal_', handleDenyRemoval],
  ['approve_group_', handleGroupApproval],
  ['deny_group_', handleGroupDenial],
  ['pending_clear_', handlePendingClear],
  ['pending_refresh_', handlePendingRefresh],
  ['ticket_create_panel_', handleTicketCreatePanel],
  ['ticket_manage_categories_', handleTicketManageCategories],
  ['ticket_customize_', handleTicketCustomize],
  ['ticket_stats_', handleTicketStats],
  ['ticket_delete_panel_', handleTicketDeletePanel],
  ['ticket_list_panels_', handleTicketListPanels],
  ['ticket_back_', handleTicketBack],
  ['category_create_', handleCategoryCreate],
  ['category_edit_', handleCategoryEdit],
  ['category_delete_confirm_', handleCategoryDeleteConfirm],
  ['panel_delete_confirm_', handlePanelDeleteConfirm],
  ['create_ticket_', handleTicketButtons],
  ['close_ticket_', handleCloseTicket],
  ['rename_ticket_', handleRenameTicket],
  ['confirm_close_', handleConfirmClose],
  ['info_refresh_', handleInfoButtons],
  ['info_detailed_', handleInfoButtons]
]);

const selectRoutes = new Map([
  ['role_group_select_', handleRoleGroupSelection],
  ['role_select_', handleIndividualRoleSelection],
  ['role_remove_select_', handleRoleRemoveSelect],
  ['rolegroup_delete_select_', handleRoleGroupDeleteSelect],
  ['rolegroup_create_select_', handleRoleGroupCreateSelect],
  ['rolegroup_edit_select_', handleRoleGroupEditSelect],
  ['pending_delete_', handlePendingDelete],
  ['ticket_panel_channel_', handleTicketPanelChannel],
  ['category_edit_select_', handleCategoryEditSelect],
  ['category_delete_select_', handleCategoryDeleteSelect],
  ['category_select_discord_', handleCategorySelectDiscord],
  ['category_style_select_', handleCategoryStyleSelect],
  ['category_edit_style_select_', handleCategoryEditStyleSelect],
  ['category_edit_discord_select_', handleCategoryEditDiscordSelect],
  ['panel_customize_select_', handlePanelCustomizeSelect],
  ['panel_delete_select_', handlePanelDeleteSelect]
]);

const modalRoutes = new Map([
  ['role_search_modal_', handleRoleSearchModal],
  ['rolegroup_nameinput_', handleRoleGroupNameInput],
  ['rolegroup_descinput_', handleRoleGroupDescInput],
  ['ticket_panel_setup_', handleTicketPanelSetup],
  ['ticket_rename_modal_', handleTicketRenameModal],
  ['category_create_modal_', handleCategoryCreateModal],
  ['category_edit_modal_', handleCategoryEditModal],
  ['panel_customize_modal_', handlePanelCustomizeModal]
]);

export async function routeButtonInteraction(interaction: any): Promise<void> {
  const customId = interaction.customId;
  
  if (customId === 'cancel_close') {
    await interaction.update({ content: 'Fermeture du ticket annulée.', components: [] });
    return;
  }

  const route = Array.from(buttonRoutes.keys()).find(key => customId.startsWith(key));
  if (route) {
    const handler = buttonRoutes.get(route);
    await handler!(interaction);
  } else if (customId.startsWith('category_delete_') && !customId.includes('confirm')) {
    await handleCategoryDelete(interaction);
  }
}

export async function routeSelectInteraction(interaction: any): Promise<void> {
  const customId = interaction.customId;
  const route = Array.from(selectRoutes.keys()).find(key => customId.startsWith(key));
  
  if (route) {
    const handler = selectRoutes.get(route);
    await handler!(interaction);
  }
}

export async function routeModalInteraction(interaction: any): Promise<void> {
  const customId = interaction.customId;
  const route = Array.from(modalRoutes.keys()).find(key => customId.startsWith(key));
  
  if (route) {
    const handler = modalRoutes.get(route);
    await handler!(interaction);
  }
}

export async function sendErrorReply(interaction: any, error: any, context: string): Promise<void> {
  console.error(`[ERREUR] ${context} :`, error);
  const errorMessage = 'Une erreur s\'est produite lors du traitement !';
  
  try {
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: errorMessage, flags: MessageFlags.Ephemeral });
    } else {
      await interaction.reply({ content: errorMessage, flags: MessageFlags.Ephemeral });
    }
  } catch (replyError) {
    console.error(`[ERREUR] Échec de l'envoi du message d'erreur :`, replyError);
  }
}
