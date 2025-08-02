import { AppDataSource } from '../utils/dataSource';
import { TicketSetupDB, TicketPanelDB, initializeRepositories } from '../utils/database';
import { TicketSetup } from '../utils/entities/TicketSetup';

async function cleanupDatabase() {
  try {
    await AppDataSource.initialize();
    initializeRepositories();
    console.log('Database connected for cleanup');

    // Get all ticket setups directly from repository
    const setupRepository = AppDataSource.getRepository(TicketSetup);
    const setups = await setupRepository.find();
    console.log(`Found ${setups.length} ticket setups`);

    // Get all ticket panels for each guild
    let totalPanels = 0;
    for (const setup of setups) {
      const panels = await TicketPanelDB.findByGuild(setup.guildId);
      totalPanels += panels.length;
      console.log(`Guild ${setup.guildId}: ${panels.length} panels`);
    }

    console.log(`Total panels found: ${totalPanels}`);
    
    // For now, let's just display information
    console.log('Cleanup completed');
    process.exit(0);
  } catch (error) {
    console.error('[ERREUR] Erreur lors du nettoyage :', error);
    process.exit(1);
  }
}

// If this script is run directly
if (require.main === module) {
  cleanupDatabase();
}

export { cleanupDatabase };
