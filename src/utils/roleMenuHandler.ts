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
  TextInputStyle
} from 'discord.js';
import { RoleRequestDB, RoleGroupDB } from '../utils/database';

// Handle role request menu
export async function handleRoleRequest(interaction: any) {
  try {
    console.log(`🎭 [ROLE REQUEST] Début de la demande de rôle par ${interaction.user.tag} (${interaction.user.id})`);
    
    const [, , userId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      console.log(`❌ [ROLE REQUEST] Accès refusé - Utilisateur ${interaction.user.tag} tente d'utiliser le bouton d'un autre utilisateur`);
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce menu !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    const guild = interaction.guild;
    console.log(`🏰 [ROLE REQUEST] Récupération des groupes de rôles pour le serveur ${guild.name} (${guild.id})`);
    const groups = await RoleGroupDB.findByGuild(guild.id);
    console.log(`📊 [ROLE REQUEST] ${groups.length} groupe(s) de rôles trouvé(s)`);

    const embed = new EmbedBuilder()
      .setTitle('👤 Demander un Rôle')
      .setDescription('Choisissez comment vous souhaitez demander un rôle')
      .setColor(0x0099FF);

    const components = [];

    // Add individual role request button
    const individualRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`role_individual_${userId}`)
          .setLabel('Rôle Individuel')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🎭'),
        new ButtonBuilder()
          .setCustomId(`role_back_${userId}`)
          .setLabel('Retour')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );

    components.push(individualRow);

    // Add role groups if any exist
    if (groups.length > 0) {
      embed.addFields({
        name: '📦 Groupes de Rôles Disponibles',
        value: 'Cliquez sur un groupe pour demander tous ses rôles',
        inline: false
      });

      // Create buttons for each group (max 5 per row)
      let currentRow = new ActionRowBuilder<ButtonBuilder>();
      let buttonsInRow = 0;

      for (const group of groups) {
        if (buttonsInRow >= 5) {
          components.push(currentRow);
          currentRow = new ActionRowBuilder<ButtonBuilder>();
          buttonsInRow = 0;
        }

        currentRow.addComponents(
          new ButtonBuilder()
            .setCustomId(`rolegroup_request_${userId}_${group.id}`)
            .setLabel(group.groupName)
            .setStyle(ButtonStyle.Success)
            .setEmoji('📦')
        );
        buttonsInRow++;
      }

      if (buttonsInRow > 0) {
        components.push(currentRow);
      }
      console.log(`✅ [ROLE REQUEST] ${groups.length} groupe(s) de rôles ajouté(s) en boutons`);
    } else {
      console.log(`ℹ️ [ROLE REQUEST] Aucun groupe de rôles disponible`);
      embed.addFields({
        name: '📦 Groupes de Rôles',
        value: 'Aucun groupe de rôles configuré sur ce serveur.',
        inline: false
      });
    }

    console.log(`📤 [ROLE REQUEST] Envoi de la réponse avec ${components.length} composant(s)`);
    await interaction.update({ embeds: [embed], components });
    console.log(`✅ [ROLE REQUEST] Demande de rôle traitée avec succès pour ${interaction.user.tag}`);

  } catch (error) {
    console.error(`💥 [ROLE REQUEST] Erreur lors du traitement de la demande de rôle pour ${interaction.user.tag} :`, error);
    await interaction.reply({ 
      content: 'Une erreur est survenue.', 
      flags: MessageFlags.Ephemeral 
    });
  }
}

// Handle individual role selection
export async function handleIndividualRole(interaction: any) {
  try {
    console.log(`🎭 [INDIVIDUAL ROLE] Début de la sélection de rôle individuel par ${interaction.user.tag} (${interaction.user.id})`);
    
    const [, , userId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      console.log(`❌ [INDIVIDUAL ROLE] Accès refusé - Utilisateur ${interaction.user.tag} tente d'utiliser le bouton d'un autre utilisateur`);
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce menu !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    // Show modal for role search
    const modal = new ModalBuilder()
      .setCustomId(`role_search_modal_${userId}`)
      .setTitle('🔍 Rechercher un rôle');

    const searchInput = new TextInputBuilder()
      .setCustomId('roleSearchQuery')
      .setLabel('Nom du rôle à rechercher')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ex: Membre, Admin, Modérateur...')
      .setRequired(true)
      .setMaxLength(50)
      .setMinLength(2);

    const firstRow = new ActionRowBuilder<TextInputBuilder>()
      .addComponents(searchInput);
    
    modal.addComponents(firstRow);

    console.log(`🔍 [INDIVIDUAL ROLE] Affichage du modal de recherche pour ${interaction.user.tag}`);
    await interaction.showModal(modal);

  } catch (error) {
    console.error(`💥 [INDIVIDUAL ROLE] Erreur lors de l'affichage du modal de recherche:`, error);
    await interaction.reply({ 
      content: 'Une erreur est survenue lors de l\'ouverture de la recherche de rôles.', 
      flags: MessageFlags.Ephemeral 
    });
  }
}

// Handle role search modal submission
export async function handleRoleSearchModal(interaction: any) {
  try {
    console.log(`🔍 [ROLE SEARCH] Début du traitement de recherche de rôle par ${interaction.user.tag}`);
    
    const [, , , userId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      console.log(`❌ [ROLE SEARCH] Accès refusé - Utilisateur ${interaction.user.tag} tente d'utiliser le modal d'un autre utilisateur`);
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce formulaire !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    const searchQuery = interaction.fields.getTextInputValue('roleSearchQuery').trim().toLowerCase();
    console.log(`🔍 [ROLE SEARCH] Recherche pour: "${searchQuery}"`);

    const guild = interaction.guild;
    
    // Search for roles matching the query
    const matchingRoles = guild.roles.cache
      .filter((role: any) => 
        !role.managed && 
        role.name !== '@everyone' && 
        role.name.toLowerCase().includes(searchQuery)
      )
      .first(25); // Discord limit

    console.log(`📊 [ROLE SEARCH] ${matchingRoles.length} rôle(s) correspondant(s) trouvé(s)`);

    if (matchingRoles.length === 0) {
      console.log(`⚠️ [ROLE SEARCH] Aucun rôle trouvé pour "${searchQuery}"`);
      return interaction.reply({
        content: `❌ Aucun rôle trouvé correspondant à "${searchQuery}". Essayez avec un autre terme de recherche.`,
        flags: MessageFlags.Ephemeral
      });
    }

    // Create select menu with matching roles
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`role_select_${userId}`)
      .setPlaceholder(`${matchingRoles.length} rôle(s) trouvé(s) pour "${searchQuery}"`)
      .addOptions(
        matchingRoles.map((role: any) => ({
          label: role.name,
          value: role.id,
          description: `Demander le rôle ${role.name}`,
          emoji: '🎭'
        }))
      );

    const actionRow = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(selectMenu);

    const backRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`role_request_${userId}`)
          .setLabel('Retour')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙'),
        new ButtonBuilder()
          .setCustomId(`role_individual_${userId}`)
          .setLabel('Nouvelle recherche')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🔍')
      );

    const embed = new EmbedBuilder()
      .setTitle('🔍 Résultats de recherche')
      .setDescription(`**${matchingRoles.length}** rôle(s) trouvé(s) pour "${searchQuery}"`)
      .setColor(0x0099FF)
      .addFields({
        name: 'Rôles trouvés',
        value: matchingRoles.map((role: any) => `• ${role.name}`).join('\n'),
        inline: false
      });

    console.log(`📤 [ROLE SEARCH] Envoi des résultats de recherche`);
    await interaction.reply({ 
      embeds: [embed], 
      components: [actionRow, backRow],
      flags: MessageFlags.Ephemeral
    });
    
    console.log(`✅ [ROLE SEARCH] Recherche de rôle traitée avec succès pour ${interaction.user.tag}`);

  } catch (error) {
    console.error(`💥 [ROLE SEARCH] Erreur lors du traitement de la recherche de rôle:`, error);
    await interaction.reply({ 
      content: 'Une erreur est survenue lors de la recherche de rôles.', 
      flags: MessageFlags.Ephemeral 
    });
  }
}

// Handle role group request (request ALL roles in the group)
export async function handleRoleGroupRequest(interaction: any) {
  try {
    console.log(`👥 [ROLE GROUP] Début de la demande de groupe de rôles par ${interaction.user.tag} (${interaction.user.id})`);
    
    const [, , userId, groupId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      console.log(`❌ [ROLE GROUP] Accès refusé - Utilisateur ${interaction.user.tag} tente d'utiliser le bouton d'un autre utilisateur`);
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce menu !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    const guild = interaction.guild;
    const member = interaction.member;
    console.log(`🔍 [ROLE GROUP] Recherche du groupe ID ${groupId} sur le serveur ${guild.name}`);
    const group = await RoleGroupDB.findByName(guild.id, '') || await RoleGroupDB.findByGuild(guild.id).then(groups => groups.find(g => g.id.toString() === groupId));

    if (!group) {
      console.log(`❌ [ROLE GROUP] Groupe ID ${groupId} introuvable`);
      return interaction.update({
        content: 'Groupe de rôles introuvable.',
        embeds: [],
        components: []
      });
    }
    
    console.log(`✅ [ROLE GROUP] Groupe trouvé : "${group.groupName}" avec ${group.rolesConfig.length} rôle(s)`);

    // Check which roles the user doesn't have yet
    const rolesToRequest = [];
    const alreadyHave = [];
    
    console.log(`🔍 [ROLE GROUP] Vérification des rôles existants pour ${interaction.user.tag}`);
    for (const roleConfig of group.rolesConfig) {
      const role = guild.roles.cache.get(roleConfig.id);
      if (role) {
        if (member.roles.cache.has(role.id)) {
          alreadyHave.push(role.name);
          console.log(`✓ [ROLE GROUP] Utilisateur possède déjà le rôle : ${role.name}`);
        } else {
          rolesToRequest.push(roleConfig);
          console.log(`+ [ROLE GROUP] Rôle à demander : ${role.name}`);
        }
      } else {
        console.log(`⚠️ [ROLE GROUP] Rôle ${roleConfig.id} (${roleConfig.name}) introuvable sur le serveur`);
      }
    }

    console.log(`📊 [ROLE GROUP] Résumé - Déjà possédés: ${alreadyHave.length}, À demander: ${rolesToRequest.length}`);

    if (rolesToRequest.length === 0) {
      console.log(`ℹ️ [ROLE GROUP] ${interaction.user.tag} possède déjà tous les rôles du groupe ${group.groupName}`);
      return interaction.update({
        content: `Vous possédez déjà tous les rôles du groupe **${group.groupName}** !`,
        embeds: [],
        components: []
      });
    }

    console.log(`📝 [ROLE GROUP] Création de l'embed de demande de groupe pour ${rolesToRequest.length} rôle(s)`);
    // Create role request for ALL roles in the group
    const requestEmbed = new EmbedBuilder()
      .setTitle('Demande de Groupe de Rôles')
      .setDescription(`${member.user.tag} a demandé le groupe de rôles **${group.groupName}**.`)
      .setColor(0x0099FF)
      .setThumbnail(member.user.displayAvatarURL())
      .addFields(
        { name: 'Utilisateur', value: `<@${member.user.id}>`, inline: true },
        { name: 'Groupe', value: group.groupName, inline: true },
        { name: 'Rôles à attribuer', value: rolesToRequest.map(r => `<@&${r.id}>`).join(', '), inline: false },
        { name: 'Demandé le', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
      );

    if (alreadyHave.length > 0) {
      requestEmbed.addFields({
        name: 'Rôles déjà possédés',
        value: alreadyHave.join(', '),
        inline: false
      });
    }

    // Create buttons for group approval/denial
    const actionRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`approve_group_${member.user.id}_${group.id}`)
          .setLabel('Approuver le Groupe')
          .setStyle(ButtonStyle.Success)
          .setEmoji('✅'),
        new ButtonBuilder()
          .setCustomId(`deny_group_${member.user.id}_${group.id}`)
          .setLabel('Refuser le Groupe')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('❌')
      );

    // Send the request in the same channel
    const requestMessage = await interaction.channel.send({ embeds: [requestEmbed], components: [actionRow] });

    // Store group request in database for each role
    for (const roleConfig of rolesToRequest) {
      const roleRequest = await RoleRequestDB.create({
        userId: member.user.id,
        roleId: roleConfig.id,
        guildId: guild.id
      });
      
      // Update each request with the same message ID
      await RoleRequestDB.updateMessageId(roleRequest.id, requestMessage.id);
    }

    await interaction.update({
      content: `✅ Votre demande pour le groupe **${group.groupName}** a été soumise pour approbation !`,
      embeds: [],
      components: []
    });

  } catch (error) {
    console.error('[ERREUR] Erreur lors du traitement de la demande de groupe de rôles :', error);
    await interaction.reply({ 
      content: 'Une erreur est survenue.', 
      flags: MessageFlags.Ephemeral 
    });
  }
}

// Handle back to main menu
export async function handleRoleBack(interaction: any) {
  // Re-execute the main role command logic
  const member = interaction.member;
  const hasManageRoles = member.permissions.has(PermissionFlagsBits.ManageRoles);

  const embed = new EmbedBuilder()
    .setTitle('🎭 Gestion des Rôles')
    .setDescription('Choisissez une action dans le menu ci-dessous')
    .setColor(0x0099FF)
    .setThumbnail(interaction.guild.iconURL())
    .addFields(
      { name: '👤 Demander un rôle', value: 'Demander un rôle spécifique ou un groupe de rôles', inline: true },
      { name: '❌ Retirer un rôle', value: 'Retirer un rôle que vous possédez', inline: true },
      { name: '📋 Mes rôles', value: 'Voir la liste de vos rôles actuels', inline: true }
    )
    .setTimestamp();

  const userRow = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`role_request_${member.user.id}`)
        .setLabel('Demander un Rôle')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('👤'),
      new ButtonBuilder()
        .setCustomId(`role_remove_${member.user.id}`)
        .setLabel('Retirer un Rôle')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('❌'),
      new ButtonBuilder()
        .setCustomId(`role_list_${member.user.id}`)
        .setLabel('Mes Rôles')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📋')
    );

  const components = [userRow];

  if (hasManageRoles) {
    embed.addFields(
      { name: '⚙️ Administration', value: 'Gérer les groupes de rôles (Admin uniquement)', inline: false }
    );

    const adminRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`rolegroup_manage_${member.user.id}`)
          .setLabel('Gérer les Groupes')
          .setStyle(ButtonStyle.Success)
          .setEmoji('⚙️'),
        new ButtonBuilder()
          .setCustomId(`role_pending_${member.user.id}`)
          .setLabel('Demandes en Attente')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('⏳')
      );

    components.push(adminRow);
  }

  await interaction.update({ embeds: [embed], components });
}

// Handle individual role selection from select menu
export async function handleIndividualRoleSelection(interaction: any) {
  try {
    console.log(`🎯 [ROLE SELECTION] Début de la sélection de rôle individuel par ${interaction.user.tag}`);
    
    const [, , userId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      console.log(`❌ [ROLE SELECTION] Accès refusé - Utilisateur ${interaction.user.tag} tente d'utiliser le menu d'un autre utilisateur`);
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce menu !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    const selectedRoleId = interaction.values[0];
    const guild = interaction.guild;
    const member = interaction.member;
    console.log(`🔍 [ROLE SELECTION] Recherche du rôle ID ${selectedRoleId} sur le serveur ${guild.name}`);
    const role = guild.roles.cache.get(selectedRoleId);

    if (!role) {
      console.log(`❌ [ROLE SELECTION] Rôle ID ${selectedRoleId} introuvable`);
      return interaction.update({
        content: 'Le rôle sélectionné n\'existe plus !',
        embeds: [],
        components: []
      });
    }

    console.log(`✅ [ROLE SELECTION] Rôle trouvé : "${role.name}" (${role.id})`);

    // Check if user already has the role
    if (member.roles.cache.has(role.id)) {
      console.log(`⚠️ [ROLE SELECTION] ${interaction.user.tag} possède déjà le rôle ${role.name}`);
      return interaction.update({
        content: `Vous avez déjà le rôle **${role.name}** !`,
        embeds: [],
        components: []
      });
    }

    console.log(`📝 [ROLE SELECTION] Vérification des demandes existantes pour ${interaction.user.tag} et le rôle ${role.name}`);

    // Check if user already has a pending request for this role
    const existingRequest = await RoleRequestDB.findByUserAndRole(member.user.id, role.id);
    if (existingRequest && existingRequest.status === 'pending') {
      return interaction.update({
        content: `Vous avez déjà une demande en attente pour le rôle **${role.name}** !`,
        embeds: [],
        components: []
      });
    }

    // Create role request embed
    const requestEmbed = new EmbedBuilder()
      .setTitle('Demande de Rôle')
      .setDescription(`${member.user.tag} a demandé le rôle **${role.name}**.`)
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
    const roleRequest = await RoleRequestDB.create({
      userId: member.user.id,
      roleId: role.id,
      guildId: guild.id
    });

    // Send the request in the same channel
    const requestMessage = await interaction.channel.send({ embeds: [requestEmbed], components: [actionRow] });

    // Update the request with the message ID
    await RoleRequestDB.updateMessageId(roleRequest.id, requestMessage.id);

    await interaction.update({
      content: `✅ Votre demande pour le rôle **${role.name}** a été soumise pour approbation !`,
      embeds: [],
      components: []
    });

  } catch (error) {
    console.error('[ERREUR] Erreur lors du traitement de la sélection de rôle individuel :', error);
    await interaction.reply({ 
      content: 'Une erreur est survenue.', 
      flags: MessageFlags.Ephemeral 
    });
  }
}

// Handle role removal menu
export async function handleRoleRemove(interaction: any) {
  try {
    const [, , userId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce menu !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    const member = interaction.member;
    const userRoles = member.roles.cache
      .filter((role: any) => !role.managed && role.name !== '@everyone')
      .first(25); // Discord limit

    if (userRoles.length === 0) {
      return interaction.update({
        content: 'Vous n\'avez aucun rôle à retirer.',
        embeds: [],
        components: []
      });
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`role_remove_select_${userId}`)
      .setPlaceholder('Choisissez un rôle à retirer')
      .addOptions(
        userRoles.map((role: any) => ({
          label: role.name,
          value: role.id,
          description: `Retirer le rôle ${role.name}`,
          emoji: '❌'
        }))
      );

    const actionRow = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(selectMenu);

    const backRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`role_back_${userId}`)
          .setLabel('Retour')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );

    const embed = new EmbedBuilder()
      .setTitle('❌ Retirer un Rôle')
      .setDescription('Choisissez le rôle que vous souhaitez retirer')
      .setColor(0xFF4444);

    await interaction.update({ 
      embeds: [embed], 
      components: [actionRow, backRow] 
    });

  } catch (error) {
    console.error('[ERREUR] Erreur lors du traitement de la suppression de rôle :', error);
    await interaction.reply({ 
      content: 'Une erreur est survenue.', 
      flags: MessageFlags.Ephemeral 
    });
  }
}

// Handle role list display
export async function handleRoleList(interaction: any) {
  try {
    const [, , userId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce menu !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    const member = interaction.member;
    const userRoles = member.roles.cache
      .filter((role: any) => !role.managed && role.name !== '@everyone')
      .map((role: any) => `<@&${role.id}>`)
      .join(', ');

    const embed = new EmbedBuilder()
      .setTitle('📋 Vos Rôles')
      .setDescription(userRoles || 'Vous n\'avez aucun rôle.')
      .setColor(0x0099FF)
      .setThumbnail(member.user.displayAvatarURL())
      .setTimestamp();

    const backRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`role_back_${userId}`)
          .setLabel('Retour')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );

    await interaction.update({ 
      embeds: [embed], 
      components: [backRow] 
    });

  } catch (error) {
    console.error('[ERREUR] Erreur lors du traitement de la liste des rôles :', error);
    await interaction.reply({ 
      content: 'Une erreur est survenue.', 
      flags: MessageFlags.Ephemeral 
    });
  }
}

// Handle rolegroup management menu
export async function handleRoleGroupManage(interaction: any) {
  try {
    const [, , userId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce menu !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    // Check permissions
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return interaction.reply({ 
        content: 'Vous n\'avez pas la permission de gérer les groupes de rôles !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('⚙️ Gestion des Groupes de Rôles')
      .setDescription('Choisissez une action pour gérer les groupes de rôles')
      .setColor(0x00FF00);

    const actionRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`rolegroup_create_${userId}`)
          .setLabel('Créer un Groupe')
          .setStyle(ButtonStyle.Success)
          .setEmoji('➕'),
        new ButtonBuilder()
          .setCustomId(`rolegroup_list_${userId}`)
          .setLabel('Lister les Groupes')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('📋'),
        new ButtonBuilder()
          .setCustomId(`rolegroup_edit_${userId}`)
          .setLabel('Modifier un Groupe')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('✏️')
      );

    const actionRow2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`rolegroup_delete_${userId}`)
          .setLabel('Supprimer un Groupe')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🗑️')
      );

    const backRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`role_back_${userId}`)
          .setLabel('Retour')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );

    await interaction.update({ 
      embeds: [embed], 
      components: [actionRow, actionRow2, backRow] 
    });

  } catch (error) {
    console.error('[ERREUR] Erreur lors du traitement de la gestion des groupes de rôles :', error);
    await interaction.reply({ 
      content: 'Une erreur est survenue.', 
      flags: MessageFlags.Ephemeral 
    });
  }
}

// Handle role removal selection
export async function handleRoleRemoveSelect(interaction: any) {
  try {
    const [, , , userId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce menu !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    const roleId = interaction.values[0];
    const role = interaction.guild.roles.cache.get(roleId);
    
    if (!role) {
      return interaction.reply({
        content: 'Rôle introuvable.',
        flags: MessageFlags.Ephemeral
      });
    }

    // Check if user actually has this role
    if (!interaction.member.roles.cache.has(roleId)) {
      return interaction.reply({
        content: 'Vous ne possédez pas ce rôle.',
        flags: MessageFlags.Ephemeral
      });
    }

    // Check if there's already a pending removal request for this role
    const existingRequest = await RoleRequestDB.findPendingByUserRoleAndType(userId, roleId, 'remove');
    if (existingRequest) {
      return interaction.reply({
        content: `Vous avez déjà une demande de retrait en attente pour le rôle **${role.name}**.`,
        flags: MessageFlags.Ephemeral
      });
    }

    try {
      // Create removal request
      const request = await RoleRequestDB.create({
        userId: userId,
        roleId: roleId,
        guildId: interaction.guild.id,
        requestType: 'remove',
        status: 'pending'
      });

      // Find a channel to send the removal request (try to find an admin channel)
      let targetChannel = interaction.guild.channels.cache.find((c: any) => 
        c.name.includes('admin') || c.name.includes('staff') || c.name.includes('mod')
      );
      
      // Fallback to system channel or first text channel
      if (!targetChannel) {
        targetChannel = interaction.guild.systemChannel || 
                       interaction.guild.channels.cache.find((c: any) => c.type === 0);
      }

      if (targetChannel) {
        const requestEmbed = new EmbedBuilder()
          .setTitle('🔴 Demande de retrait de rôle')
          .setDescription(`**${interaction.user.tag}** souhaite retirer le rôle **${role.name}**.`)
          .addFields(
            { name: 'Utilisateur', value: `<@${userId}>`, inline: true },
            { name: 'Rôle', value: `<@&${roleId}>`, inline: true },
            { name: 'Type', value: 'Retrait', inline: true },
            { name: 'Date', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
          )
          .setColor(0xFF6B6B)
          .setTimestamp();

        const approvalButtons = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`approve_removal_${userId}_${roleId}`)
              .setLabel('Approuver le retrait')
              .setStyle(ButtonStyle.Danger)
              .setEmoji('✅'),
            new ButtonBuilder()
              .setCustomId(`deny_removal_${userId}_${roleId}`)
              .setLabel('Refuser')
              .setStyle(ButtonStyle.Secondary)
              .setEmoji('❌')
          );

        const requestMessage = await targetChannel.send({
          embeds: [requestEmbed],
          components: [approvalButtons]
        });

        // Update request with message ID
        await RoleRequestDB.updateMessageId(request.id, requestMessage.id);
      }

      const confirmEmbed = new EmbedBuilder()
        .setTitle('📨 Demande de retrait envoyée')
        .setDescription(`Votre demande de retrait pour le rôle **${role.name}** a été envoyée aux administrateurs.`)
        .addFields(
          { name: 'Statut', value: 'En attente d\'approbation', inline: true },
          { name: 'Rôle', value: `<@&${roleId}>`, inline: true }
        )
        .setColor(0xFFB347)
        .setTimestamp();

      const backRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`role_back_${userId}`)
            .setLabel('Retour au menu')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔙')
        );

      await interaction.update({ 
        embeds: [confirmEmbed], 
        components: [backRow] 
      });

    } catch (dbError) {
      console.error('[ERREUR] Erreur lors de la création de la demande de suppression :', dbError);
      await interaction.reply({
        content: 'Erreur lors de la création de la demande de retrait.',
        flags: MessageFlags.Ephemeral
      });
    }

  } catch (error) {
    console.error('Erreur lors du traitement de la demande de retrait :', error);
    await interaction.reply({ 
      content: 'Une erreur est survenue.', 
      flags: MessageFlags.Ephemeral 
    });
  }
}

// Handle rolegroup creation
export async function handleRoleGroupCreate(interaction: any) {
  try {
    const [, , userId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce bouton !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    // Check admin permissions
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: 'Vous devez être administrateur pour créer des groupes de rôles.',
        flags: MessageFlags.Ephemeral
      });
    }

    const guild = interaction.guild;
    const availableRoles = guild.roles.cache
      .filter((role: any) => !role.managed && role.name !== '@everyone')
      .first(25); // Discord limit for select menu

    if (availableRoles.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle('➕ Création de groupe de rôles')
        .setDescription('Aucun rôle disponible pour créer un groupe.')
        .setColor(0xFF4444);

      const backRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`rolegroup_manage_${userId}`)
            .setLabel('Retour')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔙')
        );

      return interaction.update({ 
        embeds: [embed], 
        components: [backRow] 
      });
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`rolegroup_create_select_${userId}`)
      .setPlaceholder('Sélectionnez les rôles pour le nouveau groupe (max 25)')
      .setMinValues(1)
      .setMaxValues(Math.min(25, availableRoles.length))
      .addOptions(
        availableRoles.map((role: any) => ({
          label: role.name,
          value: role.id,
          description: `Ajouter ${role.name} au groupe`,
          emoji: '🎭'
        }))
      );

    const actionRow = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(selectMenu);

    const backRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`rolegroup_manage_${userId}`)
          .setLabel('Retour')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );

    const embed = new EmbedBuilder()
      .setTitle('➕ Création de Groupe de Rôles')
      .setDescription('**Étape 1:** Sélectionnez les rôles à inclure dans le nouveau groupe.\n\n' +
                      '**Note:** Vous pourrez ensuite nommer et décrire le groupe.')
      .setColor(0x00FF00);

    await interaction.update({ 
      embeds: [embed], 
      components: [actionRow, backRow] 
    });

  } catch (error) {
    console.error('Erreur lors de la création du groupe de rôles :', error);
    await interaction.reply({ 
      content: 'Une erreur est survenue.', 
      flags: MessageFlags.Ephemeral 
    });
  }
}

// Handle rolegroup listing
export async function handleRoleGroupList(interaction: any) {
  try {
    const [, , userId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce bouton !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    const roleGroups = await RoleGroupDB.findByGuild(interaction.guild.id);

    const embed = new EmbedBuilder()
      .setTitle('📋 Groupes de rôles')
      .setColor(0x0099FF);

    if (roleGroups.length === 0) {
      embed.setDescription('Aucun groupe de rôles configuré sur ce serveur.');
    } else {
      const groupList = roleGroups.map((group: any) => {
        const roleCount = group.rolesConfig ? group.rolesConfig.length : 0;
        return `**${group.groupName}** - ${roleCount} rôle(s)\n${group.description || 'Aucune description'}`;
      }).join('\n\n');
      
      embed.setDescription(groupList);
    }

    const backRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`rolegroup_manage_${userId}`)
          .setLabel('Retour')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );

    await interaction.update({ 
      embeds: [embed], 
      components: [backRow] 
    });

  } catch (error) {
    console.error('[ERREUR] Erreur lors du traitement de la liste des groupes de rôles :', error);
    await interaction.reply({ 
      content: 'Une erreur est survenue.', 
      flags: MessageFlags.Ephemeral 
    });
  }
}

// Handle rolegroup deletion
export async function handleRoleGroupDelete(interaction: any) {
  try {
    const [, , userId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce bouton !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    // Check admin permissions
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: 'Vous devez être administrateur pour supprimer des groupes de rôles.',
        flags: MessageFlags.Ephemeral
      });
    }

    const roleGroups = await RoleGroupDB.findByGuild(interaction.guild.id);

    if (roleGroups.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle('🗑️ Suppression de groupe')
        .setDescription('Aucun groupe de rôles à supprimer.')
        .setColor(0xFF4444);

      const backRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`rolegroup_manage_${userId}`)
            .setLabel('Retour')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔙')
        );

      return interaction.update({ 
        embeds: [embed], 
        components: [backRow] 
      });
    }

    const selectOptions = roleGroups.slice(0, 25).map((group: any) => ({
      label: group.groupName,
      value: group.id.toString(),
      description: group.description || 'Aucune description'
    }));

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`rolegroup_delete_select_${userId}`)
      .setPlaceholder('Choisissez un groupe à supprimer')
      .addOptions(selectOptions);

    const actionRow = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(selectMenu);

    const backRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`rolegroup_manage_${userId}`)
          .setLabel('Retour')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );

    const embed = new EmbedBuilder()
      .setTitle('🗑️ Suppression de groupe')
      .setDescription('Sélectionnez le groupe de rôles à supprimer :')
      .setColor(0xFF4444);

    await interaction.update({ 
      embeds: [embed], 
      components: [actionRow, backRow] 
    });

  } catch (error) {
    console.error('Erreur lors de la suppression du groupe de rôles :', error);
    await interaction.reply({ 
      content: 'Une erreur est survenue.', 
      flags: MessageFlags.Ephemeral 
    });
  }
}

// Handle rolegroup deletion confirmation
export async function handleRoleGroupDeleteSelect(interaction: any) {
  try {
    const [, , , userId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce menu !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    const groupId = parseInt(interaction.values[0]);
    
    // Find the role group in our list
    const roleGroups = await RoleGroupDB.findByGuild(interaction.guild.id);
    const roleGroup = roleGroups.find(group => group.id === groupId);

    if (!roleGroup) {
      return interaction.reply({
        content: 'Groupe de rôles introuvable.',
        flags: MessageFlags.Ephemeral
      });
    }

    try {
      await RoleGroupDB.delete(roleGroup.id);
      
      const embed = new EmbedBuilder()
        .setTitle('✅ Groupe supprimé')
        .setDescription(`Le groupe **${roleGroup.groupName}** a été supprimé avec succès !`)
        .setColor(0x00FF00)
        .setTimestamp();

      const backRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`rolegroup_manage_${userId}`)
            .setLabel('Retour au menu')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔙')
        );

      await interaction.update({ 
        embeds: [embed], 
        components: [backRow] 
      });

    } catch (dbError) {
      console.error('Erreur lors de la suppression du groupe de rôles :', dbError);
      await interaction.reply({
        content: 'Erreur lors de la suppression du groupe.',
        flags: MessageFlags.Ephemeral
      });
    }

  } catch (error) {
    console.error('Erreur lors du traitement de la sélection de suppression du groupe de rôles :', error);
    await interaction.reply({ 
      content: 'Une erreur est survenue.', 
      flags: MessageFlags.Ephemeral 
    });
  }
}

// Handle rolegroup creation role selection
export async function handleRoleGroupCreateSelect(interaction: any) {
  try {
    const [, , , userId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce menu !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    const selectedRoleIds = interaction.values;
    const guild = interaction.guild;
    
    // Get role names for display
    const selectedRoles = selectedRoleIds.map((roleId: string) => {
      const role = guild.roles.cache.get(roleId);
      return role ? role.name : 'Rôle introuvable';
    }).join(', ');

    // Create group with timestamp-based name automatically
    const timestamp = Math.floor(Date.now() / 1000);
    const groupName = `NouveauGroupe_${timestamp}`;
    
    await createRoleGroupWithRoles(interaction, selectedRoleIds, groupName, 'Groupe créé via le menu');

  } catch (error) {
    console.error('[ERREUR] Erreur lors du traitement de la sélection de création de groupe de rôles :', error);
    await interaction.reply({ 
      content: 'Une erreur est survenue.', 
      flags: MessageFlags.Ephemeral 
    });
  }
}

// Helper function to create role group
async function createRoleGroupWithRoles(interaction: any, roleIds: string[], groupName: string, description: string) {
  try {
    const guild = interaction.guild;
    
    // Create role configurations
    const rolesConfig = roleIds.map((roleId: string) => {
      const role = guild.roles.cache.get(roleId);
      return {
        id: roleId,
        name: role ? role.name : 'Rôle introuvable'
      };
    });

    // Create the role group in database
    await RoleGroupDB.create({
      guildId: guild.id,
      groupName: groupName,
      rolesConfig: rolesConfig,
      description: description
    });

    const embed = new EmbedBuilder()
      .setTitle('✅ Groupe créé')
      .setDescription(`Le groupe **${groupName}** a été créé avec succès !`)
      .addFields(
        { name: 'Rôles inclus', value: rolesConfig.map(r => r.name).join(', '), inline: false },
        { name: 'Description', value: description, inline: false }
      )
      .setColor(0x00FF00)
      .setTimestamp();

    const backRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`rolegroup_manage_${interaction.user.id}`)
          .setLabel('Retour au menu')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );

    await interaction.update({ 
      embeds: [embed], 
      components: [backRow] 
    });

  } catch (dbError) {
    console.error('[ERREUR] Erreur lors de la création du groupe de rôles :', dbError);
    await interaction.reply({
      content: 'Erreur lors de la création du groupe. Vérifiez que le nom n\'existe pas déjà.',
      flags: MessageFlags.Ephemeral
    });
  }
}

// Handle pending role requests
export async function handleRolePending(interaction: any) {
  try {
    const [, , userId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce bouton !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    // Check admin permissions
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return interaction.reply({
        content: 'Vous devez avoir la permission de gérer les rôles pour voir les demandes en attente.',
        flags: MessageFlags.Ephemeral
      });
    }

    const pendingRequests = await RoleRequestDB.findPendingByGuild(interaction.guild.id);

    const embed = new EmbedBuilder()
      .setTitle('⏳ Demandes en attente')
      .setColor(0xFFAA00);

    if (pendingRequests.length === 0) {
      embed.setDescription('Aucune demande de rôle en attente.');
      
      const backRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`role_back_${userId}`)
            .setLabel('Retour')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔙')
        );

      return await interaction.update({ 
        embeds: [embed], 
        components: [backRow] 
      });
    }

    // Group requests by user for better display
    const requestsByUser = new Map();
    for (const request of pendingRequests) {
      if (!requestsByUser.has(request.userId)) {
        requestsByUser.set(request.userId, []);
      }
      requestsByUser.get(request.userId).push(request);
    }

    let description = '';
    let rowCounter = 0;
    const maxDisplayed = 8; // Limit for better UI

    for (const [userId, userRequests] of requestsByUser) {
      if (rowCounter >= maxDisplayed) break;
      
      const user = `<@${userId}>`;
      const addRequests = userRequests.filter((req: any) => req.requestType === 'add' || !req.requestType);
      const removeRequests = userRequests.filter((req: any) => req.requestType === 'remove');
      const date = new Date(userRequests[0].createdAt).toLocaleDateString('fr-FR');
      
      description += `**${user}**\n`;
      
      if (addRequests.length > 0) {
        const addRoles = addRequests.map((req: any) => `<@&${req.roleId}>`).join(', ');
        description += `└ ➕ **Ajout:** ${addRoles}\n`;
      }
      
      if (removeRequests.length > 0) {
        const removeRoles = removeRequests.map((req: any) => `<@&${req.roleId}>`).join(', ');
        description += `└ ➖ **Retrait:** ${removeRoles}\n`;
      }
      
      description += `└ 📅 ${date}\n\n`;
      rowCounter++;
    }

    embed.setDescription(description || 'Aucune demande de rôle en attente.');
    
    if (pendingRequests.length > maxDisplayed) {
      embed.setFooter({ 
        text: `Affichage de ${Math.min(maxDisplayed, requestsByUser.size)} utilisateurs sur ${requestsByUser.size} | ${pendingRequests.length} demandes au total` 
      });
    } else {
      embed.setFooter({ 
        text: `${pendingRequests.length} demande${pendingRequests.length > 1 ? 's' : ''} au total` 
      });
    }

    // Create action buttons
    const actionRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`pending_clear_${userId}`)
          .setLabel('Vider la Liste')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🗑️'),
        new ButtonBuilder()
          .setCustomId(`pending_refresh_${userId}`)
          .setLabel('Actualiser')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🔄'),
        new ButtonBuilder()
          .setCustomId(`role_back_${userId}`)
          .setLabel('Retour')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );

    // Create select menu for individual deletion if there are requests
    let components: any[] = [actionRow];
    
    if (pendingRequests.length > 0) {
      const selectOptions = pendingRequests.slice(0, 25).map((request: any) => ({
        label: `Supprimer demande`,
        description: `${request.userId.slice(-4)} → Rôle ${request.roleId.slice(-4)}`,
        value: `delete_${request.id}`,
        emoji: '❌'
      }));

      const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`pending_delete_${userId}`)
            .setPlaceholder('Supprimer une demande spécifique...')
            .addOptions(selectOptions)
        );
      
      components.unshift(selectRow);
    }

    await interaction.update({ 
      embeds: [embed], 
      components: components 
    });

  } catch (error) {
    console.error('[ERREUR] Erreur lors du traitement des rôles en attente :', error);
    await interaction.reply({ 
      content: 'Une erreur est survenue.', 
      flags: MessageFlags.Ephemeral 
    });
  }
}

// Handle rolegroup editing
export async function handleRoleGroupEdit(interaction: any) {
  try {
    const [, , userId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce bouton !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    // Check admin permissions
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: 'Vous devez être administrateur pour modifier des groupes de rôles.',
        flags: MessageFlags.Ephemeral
      });
    }

    const roleGroups = await RoleGroupDB.findByGuild(interaction.guild.id);

    if (roleGroups.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle('✏️ Modification de groupe')
        .setDescription('Aucun groupe de rôles à modifier.')
        .setColor(0xFF4444);

      const backRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`rolegroup_manage_${userId}`)
            .setLabel('Retour')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔙')
        );

      return interaction.update({ 
        embeds: [embed], 
        components: [backRow] 
      });
    }

    const selectOptions = roleGroups.slice(0, 25).map((group: any) => ({
      label: group.groupName,
      value: group.id.toString(),
      description: group.description || 'Aucune description'
    }));

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`rolegroup_edit_select_${userId}`)
      .setPlaceholder('Choisissez un groupe à modifier')
      .addOptions(selectOptions);

    const actionRow = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(selectMenu);

    const backRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`rolegroup_manage_${userId}`)
          .setLabel('Retour')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );

    const embed = new EmbedBuilder()
      .setTitle('✏️ Modification de groupe')
      .setDescription('Sélectionnez le groupe de rôles à modifier :')
      .setColor(0x00AAFF);

    await interaction.update({ 
      embeds: [embed], 
      components: [actionRow, backRow] 
    });

  } catch (error) {
    console.error('Erreur lors du traitement de la modification du groupe de rôles :', error);
    await interaction.reply({ 
      content: 'Une erreur est survenue.', 
      flags: MessageFlags.Ephemeral 
    });
  }
}

// Handle rolegroup edit selection
export async function handleRoleGroupEditSelect(interaction: any) {
  try {
    const [, , , userId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce menu !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    const groupId = parseInt(interaction.values[0]);
    
    // Find the role group in our list
    const roleGroups = await RoleGroupDB.findByGuild(interaction.guild.id);
    const roleGroup = roleGroups.find(group => group.id === groupId);

    if (!roleGroup) {
      return interaction.reply({
        content: 'Groupe de rôles introuvable.',
        flags: MessageFlags.Ephemeral
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('✏️ Modification de groupe')
      .setDescription(`**Groupe sélectionné:** ${roleGroup.groupName}\n\nQue souhaitez-vous modifier ?`)
      .addFields(
        { name: 'Nom actuel', value: roleGroup.groupName, inline: true },
        { name: 'Description actuelle', value: roleGroup.description || 'Aucune description', inline: true },
        { name: 'Nombre de rôles', value: roleGroup.rolesConfig.length.toString(), inline: true }
      )
      .setColor(0x00AAFF);

    const actionRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`rolegroup_editname_${userId}_${groupId}`)
          .setLabel('Modifier le nom')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('📝'),
        new ButtonBuilder()
          .setCustomId(`rolegroup_editdesc_${userId}_${groupId}`)
          .setLabel('Modifier la description')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('📄')
      );

    const backRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`rolegroup_edit_${userId}`)
          .setLabel('Retour')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );

    await interaction.update({ 
      embeds: [embed], 
      components: [actionRow, backRow] 
    });

  } catch (error) {
    console.error('Erreur lors du traitement de la modification du groupe de rôles :', error);
    await interaction.reply({ 
      content: 'Une erreur est survenue.', 
      flags: MessageFlags.Ephemeral 
    });
  }
}

// Handle rolegroup name editing
export async function handleRoleGroupEditName(interaction: any) {
  try {
    const [, , userId, groupId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce bouton !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    // Create modal for custom name input
    const modal = new ModalBuilder()
      .setCustomId(`rolegroup_nameinput_${userId}_${groupId}`)
      .setTitle('Modifier le nom du groupe');

    const nameInput = new TextInputBuilder()
      .setCustomId('groupName')
      .setLabel('Nouveau nom du groupe')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Entrez le nouveau nom...')
      .setRequired(true)
      .setMaxLength(50);

    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput);
    modal.addComponents(firstActionRow);

    await interaction.showModal(modal);

  } catch (error) {
    console.error('Erreur lors du traitement de la modification du nom du groupe de rôles :', error);
    await interaction.reply({ 
      content: 'Une erreur est survenue.', 
      flags: MessageFlags.Ephemeral 
    });
  }
}

// Handle rolegroup description editing
export async function handleRoleGroupEditDesc(interaction: any) {
  try {
    const [, , userId, groupId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce bouton !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    // Create modal for custom description input
    const modal = new ModalBuilder()
      .setCustomId(`rolegroup_descinput_${userId}_${groupId}`)
      .setTitle('Modifier la description du groupe');

    const descInput = new TextInputBuilder()
      .setCustomId('groupDescription')
      .setLabel('Nouvelle description du groupe')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Entrez la nouvelle description...')
      .setRequired(false)
      .setMaxLength(500);

    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(descInput);
    modal.addComponents(firstActionRow);

    await interaction.showModal(modal);

  } catch (error) {
    console.error('[ERREUR] Erreur lors du traitement de la modification de description du groupe de rôles :', error);
    await interaction.reply({ 
      content: 'Une erreur est survenue.', 
      flags: MessageFlags.Ephemeral 
    });
  }
}

// Handle modal submission for name input
export async function handleRoleGroupNameInput(interaction: any) {
  try {
    const [, , userId, groupId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce modal !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    const newName = interaction.fields.getTextInputValue('groupName').trim();
    const actualGroupId = parseInt(groupId);
    
    if (!newName) {
      return interaction.reply({
        content: 'Le nom ne peut pas être vide.',
        flags: MessageFlags.Ephemeral
      });
    }

    // Find the role group
    const roleGroups = await RoleGroupDB.findByGuild(interaction.guild.id);
    const roleGroup = roleGroups.find(group => group.id === actualGroupId);

    if (!roleGroup) {
      return interaction.reply({
        content: 'Groupe de rôles introuvable.',
        flags: MessageFlags.Ephemeral
      });
    }

    try {
      await RoleGroupDB.update(actualGroupId, { groupName: newName });
      
      const embed = new EmbedBuilder()
        .setTitle('✅ Nom modifié')
        .setDescription(`Le groupe a été renommé en **${newName}** avec succès !`)
        .addFields(
          { name: 'Ancien nom', value: roleGroup.groupName, inline: true },
          { name: 'Nouveau nom', value: newName, inline: true }
        )
        .setColor(0x00FF00)
        .setTimestamp();

      const backRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`rolegroup_manage_${userId}`)
            .setLabel('Retour au menu')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔙')
        );

      await interaction.reply({ 
        embeds: [embed], 
        components: [backRow],
        flags: MessageFlags.Ephemeral
      });

    } catch (dbError) {
      console.error('Erreur lors de la modification du nom du groupe de rôles :', dbError);
      await interaction.reply({
        content: 'Erreur lors de la modification du nom. Ce nom existe peut-être déjà.',
        flags: MessageFlags.Ephemeral
      });
    }

  } catch (error) {
    console.error('Erreur lors du traitement de la modification du nom du groupe de rôles :', error);
    await interaction.reply({ 
      content: 'Une erreur est survenue.', 
      flags: MessageFlags.Ephemeral 
    });
  }
}

// Handle modal submission for description input
export async function handleRoleGroupDescInput(interaction: any) {
  try {
    const [, , userId, groupId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce modal !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    const newDesc = interaction.fields.getTextInputValue('groupDescription').trim();
    const actualGroupId = parseInt(groupId);
    
    // Find the role group
    const roleGroups = await RoleGroupDB.findByGuild(interaction.guild.id);
    const roleGroup = roleGroups.find(group => group.id === actualGroupId);

    if (!roleGroup) {
      return interaction.reply({
        content: 'Groupe de rôles introuvable.',
        flags: MessageFlags.Ephemeral
      });
    }

    const finalDesc = newDesc || 'Aucune description';

    try {
      await RoleGroupDB.update(actualGroupId, { description: finalDesc });
      
      const embed = new EmbedBuilder()
        .setTitle('✅ Description modifiée')
        .setDescription(`La description du groupe **${roleGroup.groupName}** a été mise à jour !`)
        .addFields(
          { name: 'Ancienne description', value: roleGroup.description || 'Aucune', inline: false },
          { name: 'Nouvelle description', value: finalDesc, inline: false }
        )
        .setColor(0x00FF00)
        .setTimestamp();

      const backRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`rolegroup_manage_${userId}`)
            .setLabel('Retour au menu')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔙')
        );

      await interaction.reply({ 
        embeds: [embed], 
        components: [backRow],
        flags: MessageFlags.Ephemeral
      });

    } catch (dbError) {
      console.error('Erreur lors de la modification de la description du groupe de rôles :', dbError);
      await interaction.reply({
        content: 'Erreur lors de la modification de la description.',
        flags: MessageFlags.Ephemeral
      });
    }

  } catch (error) {
    console.error('Erreur lors du traitement de la modification de la description du groupe de rôles :', error);
    await interaction.reply({ 
      content: 'Une erreur est survenue.', 
      flags: MessageFlags.Ephemeral 
    });
  }
}

// Handle group approval
export async function handleGroupApproval(interaction: any) {
  try {
    const [, , userId, groupId] = interaction.customId.split('_');
    const actualGroupId = parseInt(groupId);
    
    // Check if user has permission
    if (!interaction.member.permissions.has('ManageRoles')) {
      return interaction.reply({
        content: 'Vous n\'avez pas la permission d\'approuver des demandes de rôles.',
        flags: MessageFlags.Ephemeral
      });
    }

    // Find all pending requests for this user in this guild
    const groupRequests = await RoleRequestDB.findPendingByGuild(interaction.guild.id);
    const userRequests = groupRequests.filter(request => request.userId === userId);

    if (userRequests.length === 0) {
      return interaction.reply({
        content: 'Aucune demande en attente trouvée pour cet utilisateur.',
        flags: MessageFlags.Ephemeral
      });
    }

    // Get the role group info
    const roleGroups = await RoleGroupDB.findByGuild(interaction.guild.id);
    const roleGroup = roleGroups.find(group => group.id === actualGroupId);

    if (!roleGroup) {
      return interaction.reply({
        content: 'Groupe de rôles introuvable.',
        flags: MessageFlags.Ephemeral
      });
    }

    const member = await interaction.guild.members.fetch(userId);
    const rolesToAssign = roleGroup.rolesConfig;
    let assignedRoles = [];
    let failedRoles = [];

    // Assign all roles in the group
    for (const roleConfig of rolesToAssign) {
      try {
        const role = await interaction.guild.roles.fetch(roleConfig.id);
        if (role) {
          await member.roles.add(role);
          assignedRoles.push(role.name);
        }
      } catch (error) {
        console.error(`Failed to assign role ${roleConfig.id}:`, error);
        failedRoles.push(roleConfig.name);
      }
    }

    // Update all related requests to approved
    for (const request of userRequests) {
      await RoleRequestDB.updateStatus(request.id, 'approved', interaction.user.id);
    }

    // Create success embed
    const embed = new EmbedBuilder()
      .setTitle('✅ Demande de groupe approuvée')
      .setDescription(`La demande de groupe **${roleGroup.groupName}** de ${member} a été approuvée !`)
      .addFields(
        { name: 'Rôles assignés', value: assignedRoles.length > 0 ? assignedRoles.join(', ') : 'Aucun', inline: false },
        { name: 'Approuvé par', value: `<@${interaction.user.id}>`, inline: true },
        { name: 'Date', value: new Date().toLocaleString('fr-FR'), inline: true }
      )
      .setColor(0x00FF00)
      .setTimestamp();

    if (failedRoles.length > 0) {
      embed.addFields({ name: '⚠️ Rôles non assignés', value: failedRoles.join(', '), inline: false });
    }

    await interaction.update({ embeds: [embed], components: [] });

  } catch (error) {
    console.error('Erreur lors du traitement de l\'approbation du groupe :', error);
    await interaction.reply({ 
      content: 'Une erreur est survenue lors de l\'approbation.', 
      flags: MessageFlags.Ephemeral 
    });
  }
}

// Handle group denial
export async function handleGroupDenial(interaction: any) {
  try {
    const [, , userId, groupId] = interaction.customId.split('_');
    const actualGroupId = parseInt(groupId);
    
    // Check if user has permission
    if (!interaction.member.permissions.has('ManageRoles')) {
      return interaction.reply({
        content: 'Vous n\'avez pas la permission de refuser des demandes de rôles.',
        flags: MessageFlags.Ephemeral
      });
    }

    // Find all pending requests for this user in this guild
    const groupRequests = await RoleRequestDB.findPendingByGuild(interaction.guild.id);
    const userRequests = groupRequests.filter(request => request.userId === userId);

    if (userRequests.length === 0) {
      return interaction.reply({
        content: 'Aucune demande en attente trouvée pour cet utilisateur.',
        flags: MessageFlags.Ephemeral
      });
    }

    // Get the role group info
    const roleGroups = await RoleGroupDB.findByGuild(interaction.guild.id);
    const roleGroup = roleGroups.find(group => group.id === actualGroupId);

    if (!roleGroup) {
      return interaction.reply({
        content: 'Groupe de rôles introuvable.',
        flags: MessageFlags.Ephemeral
      });
    }

    const member = await interaction.guild.members.fetch(userId);

    // Update all related requests to denied
    for (const request of userRequests) {
      await RoleRequestDB.updateStatus(request.id, 'denied', interaction.user.id);
    }

    // Create denial embed
    const embed = new EmbedBuilder()
      .setTitle('❌ Demande de groupe refusée')
      .setDescription(`La demande de groupe **${roleGroup.groupName}** de ${member} a été refusée.`)
      .addFields(
        { name: 'Refusé par', value: `<@${interaction.user.id}>`, inline: true },
        { name: 'Date', value: new Date().toLocaleString('fr-FR'), inline: true },
        { name: 'Raison', value: 'Non spécifiée', inline: false }
      )
      .setColor(0xFF0000)
      .setTimestamp();

    await interaction.update({ embeds: [embed], components: [] });

  } catch (error) {
    console.error('Erreur lors du traitement du refus du groupe :', error);
    await interaction.reply({ 
      content: 'Une erreur est survenue lors du refus.', 
      flags: MessageFlags.Ephemeral 
    });
  }
}

// Handle pending request deletion
export async function handlePendingDelete(interaction: any) {
  try {
    const [, , userId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce menu !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return interaction.reply({
        content: 'Vous devez avoir la permission de gérer les rôles.',
        flags: MessageFlags.Ephemeral
      });
    }

    const selectedValue = interaction.values[0];
    const requestId = parseInt(selectedValue.split('_')[1]);

    // Find the request to get the message ID
    const request = await RoleRequestDB.findById(requestId);
    
    if (request && request.messageId) {
      try {
        // Try to delete the original message
        const channel = interaction.channel;
        const message = await channel.messages.fetch(request.messageId);
        if (message) {
          await message.delete();
        }
      } catch (messageError) {
        console.log('Erreur lors de la suppression du message original :', messageError);
        // Continue with database deletion even if message deletion fails
      }
    }

    await RoleRequestDB.delete(requestId);

    const embed = new EmbedBuilder()
      .setTitle('✅ Demande supprimée')
      .setDescription('La demande sélectionnée a été supprimée avec succès.')
      .setColor(0x00FF00)
      .setTimestamp();

    const backRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`role_pending_${userId}`)
          .setLabel('Retour aux demandes')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('⏳'),
        new ButtonBuilder()
          .setCustomId(`role_back_${userId}`)
          .setLabel('Menu principal')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );

    await interaction.update({ 
      embeds: [embed], 
      components: [backRow] 
    });

  } catch (error) {
    console.error('Erreur lors du traitement de la suppression en attente :', error);
    await interaction.reply({ 
      content: 'Une erreur est survenue lors de la suppression.', 
      flags: MessageFlags.Ephemeral 
    });
  }
}

// Handle pending clear all
export async function handlePendingClear(interaction: any) {
  try {
    const [, , userId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce bouton !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return interaction.reply({
        content: 'Vous devez avoir la permission de gérer les rôles.',
        flags: MessageFlags.Ephemeral
      });
    }

    const pendingRequests = await RoleRequestDB.findPendingByGuild(interaction.guild.id);
    
    if (pendingRequests.length === 0) {
      return interaction.reply({
        content: 'Aucune demande en attente à supprimer.',
        flags: MessageFlags.Ephemeral
      });
    }

    // Delete all pending requests and their messages
    const messagesDeleted = new Set(); // To avoid deleting the same message multiple times
    
    for (const request of pendingRequests) {
      // Try to delete the original message if it exists and hasn't been deleted yet
      if (request.messageId && !messagesDeleted.has(request.messageId)) {
        try {
          const channel = interaction.channel;
          const message = await channel.messages.fetch(request.messageId);
          if (message) {
            await message.delete();
            messagesDeleted.add(request.messageId);
          }
        } catch (messageError) {
          console.log('Erreur lors de la suppression du message :', messageError);
          // Continuer avec la suppression de la base de données même si la suppression du message échoue
        }
      }
      
      await RoleRequestDB.delete(request.id);
    }

    const embed = new EmbedBuilder()
      .setTitle('🗑️ Liste vidée')
      .setDescription(`${pendingRequests.length} demande${pendingRequests.length > 1 ? 's' : ''} en attente supprimée${pendingRequests.length > 1 ? 's' : ''}.`)
      .setColor(0xFF6B6B)
      .setTimestamp();

    const backRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`role_pending_${userId}`)
          .setLabel('Voir les demandes')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('⏳'),
        new ButtonBuilder()
          .setCustomId(`role_back_${userId}`)
          .setLabel('Menu principal')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );

    await interaction.update({ 
      embeds: [embed], 
      components: [backRow] 
    });

  } catch (error) {
    console.error('Erreur lors du traitement de la suppression en attente :', error);
    await interaction.reply({
      content: 'Une erreur est survenue lors du vidage.',
      flags: MessageFlags.Ephemeral
    });
  }
}

// Handle pending refresh
export async function handlePendingRefresh(interaction: any) {
  try {
    const [, , userId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
      return interaction.reply({ 
        content: 'Vous n\'êtes pas autorisé à utiliser ce bouton !', 
        flags: MessageFlags.Ephemeral 
      });
    }

    // Simply call the pending handler to refresh
    await handleRolePending(interaction);

  } catch (error) {
    console.error('Erreur lors du traitement de l\'actualisation en attente :', error);
    await interaction.reply({
      content: 'Une erreur est survenue lors de l\'actualisation.',
      flags: MessageFlags.Ephemeral
    });
  }
}

// Handle approval of role removal requests
export async function handleApproveRemoval(interaction: any) {
  const [, , userId, roleId] = interaction.customId.split('_');
  
  // Check if user has permission to manage roles
  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
    return interaction.reply({ content: 'Vous n\'avez pas la permission de gérer les demandes de rôles !', flags: MessageFlags.Ephemeral });
  }

  const request = await RoleRequestDB.findPendingByUserRoleAndType(userId, roleId, 'remove');
  
  if (!request) {
    return interaction.reply({ content: 'Cette demande de retrait n\'existe plus !', flags: MessageFlags.Ephemeral });
  }

  const guild = interaction.guild;
  const member = await guild.members.fetch(userId);
  const role = await guild.roles.fetch(roleId);

  if (!member || !role) {
    return interaction.reply({ content: 'Membre ou rôle introuvable !', flags: MessageFlags.Ephemeral });
  }

  try {
    await member.roles.remove(role);
    
    // Update request status
    await RoleRequestDB.updateStatus(request.id, 'approved', interaction.user.id);

    const embed = new EmbedBuilder()
      .setTitle('Demande de retrait approuvée')
      .setDescription(`Le rôle **${role.name}** a été retiré de ${member.user.tag}.`)
      .setColor(0x00FF00)
      .addFields(
        { name: 'Approuvé par', value: `<@${interaction.user.id}>`, inline: true },
        { name: 'Utilisateur', value: `<@${member.user.id}>`, inline: true },
        { name: 'Rôle', value: `<@&${role.id}>`, inline: true }
      )
      .setTimestamp();

    await interaction.update({ embeds: [embed], components: [] });

  } catch (error) {
    console.error('Erreur lors du retrait du rôle :', error);
    await interaction.reply({ content: 'Erreur lors du retrait du rôle !', flags: MessageFlags.Ephemeral });
  }
}

// Handle denial of role removal requests
export async function handleDenyRemoval(interaction: any) {
  const [, , userId, roleId] = interaction.customId.split('_');
  
  // Check if user has permission to manage roles
  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
    return interaction.reply({ content: 'Vous n\'avez pas la permission de gérer les demandes de rôles !', flags: MessageFlags.Ephemeral });
  }

  const request = await RoleRequestDB.findPendingByUserRoleAndType(userId, roleId, 'remove');
  
  if (!request) {
    return interaction.reply({ content: 'Cette demande de retrait n\'existe plus !', flags: MessageFlags.Ephemeral });
  }

  const guild = interaction.guild;
  const member = await guild.members.fetch(userId);
  const role = await guild.roles.fetch(roleId);

  if (!member || !role) {
    return interaction.reply({ content: 'Membre ou rôle introuvable !', flags: MessageFlags.Ephemeral });
  }

  try {
    // Update request status
    await RoleRequestDB.updateStatus(request.id, 'denied', interaction.user.id);

    const embed = new EmbedBuilder()
      .setTitle('Demande de retrait refusée')
      .setDescription(`La demande de retrait du rôle **${role.name}** pour ${member.user.tag} a été refusée.`)
      .setColor(0xFF0000)
      .addFields(
        { name: 'Refusé par', value: `<@${interaction.user.id}>`, inline: true },
        { name: 'Utilisateur', value: `<@${member.user.id}>`, inline: true },
        { name: 'Rôle', value: `<@&${role.id}>`, inline: true }
      )
      .setTimestamp();

    await interaction.update({ embeds: [embed], components: [] });

  } catch (error) {
    console.error('Erreur lors du refus de la demande :', error);
    await interaction.reply({ content: 'Erreur lors du refus de la demande !', flags: MessageFlags.Ephemeral });
  }
}
