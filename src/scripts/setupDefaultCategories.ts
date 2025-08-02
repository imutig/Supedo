import { AppDataSource } from '../utils/dataSource';
import { TicketCategoryDB } from '../utils/database';
import { ButtonStyle } from 'discord.js';

const defaultCategories = [
  {
    categoryKey: 'support',
    categoryName: 'Support Général',
    buttonLabel: 'Obtenir de l\'aide',
    buttonEmoji: '🎫',
    buttonStyle: ButtonStyle.Primary,
    openMessage: 'Bonjour! Merci d\'avoir ouvert un ticket de support. Veuillez décrire votre problème en détail et notre équipe vous aidera dès que possible.'
  },
  {
    categoryKey: 'technique',
    categoryName: 'Support Technique',
    buttonLabel: 'Problème Technique',
    buttonEmoji: '⚙️',
    buttonStyle: ButtonStyle.Secondary,
    openMessage: 'Vous avez un problème technique? Décrivez-nous votre problème (erreurs, bugs, fonctionnalités qui ne marchent pas) et nous vous aiderons à le résoudre.'
  },
  {
    categoryKey: 'facturation',
    categoryName: 'Questions Facturation',
    buttonLabel: 'Facturation',
    buttonEmoji: '💳',
    buttonStyle: ButtonStyle.Success,
    openMessage: 'Pour toute question concernant la facturation, les paiements ou votre abonnement, notre équipe financière vous assistera.'
  },
  {
    categoryKey: 'signalement',
    categoryName: 'Signaler un Problème',
    buttonLabel: 'Signaler',
    buttonEmoji: '⚠️',
    buttonStyle: ButtonStyle.Danger,
    openMessage: 'Merci de signaler ce problème. Veuillez fournir le maximum de détails possible pour nous aider à enquêter rapidement.'
  }
];

export async function setupDefaultCategories(guildId: string, discordCategoryId?: string) {
  try {
    await AppDataSource.initialize();
    console.log('Database connected for category setup');

    for (const category of defaultCategories) {
      // Check if category already exists
      const existing = await TicketCategoryDB.findByCategoryKey(guildId, category.categoryKey);
      
      if (!existing) {
        await TicketCategoryDB.create({
          guildId: guildId,
          discordCategoryId: discordCategoryId,
          ...category
        });
        console.log(`Created category: ${category.categoryName}`);
      } else {
        console.log(`Category already exists: ${category.categoryName}`);
      }
    }

    console.log('Default categories setup completed');
    process.exit(0);
  } catch (error) {
    console.error('[ERREUR] Erreur lors de la configuration des catégories par défaut :', error);
    process.exit(1);
  }
}

// If this script is run directly
if (require.main === module) {
  const guildId = process.argv[2];
  const discordCategoryId = process.argv[3];
  
  if (!guildId) {
    console.error('Usage: npm run setup-categories YOUR_GUILD_ID [DISCORD_CATEGORY_ID]');
    console.error('Example: npm run setup-categories 123456789012345678');
    console.error('Example with category: npm run setup-categories 123456789012345678 987654321098765432');
    process.exit(1);
  }
  
  setupDefaultCategories(guildId, discordCategoryId);
}
