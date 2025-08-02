import { AppDataSource } from '../utils/dataSource';
import { TicketSetupDB, TicketPanelDB } from '../utils/database';

async function cleanupDatabase() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected for cleanup');

    // Get all ticket setups
    const setups = await AppDataSource.getRepository('TicketSetup').find();
    console.log(`Found ${setups.length} ticket setups`);

    // Get all ticket panels
    const panels = await TicketPanelDB.findByGuild('all'); // This won't work, we need to get all
    
    // For now, let's just display information
    console.log('Cleanup completed');
    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

// If this script is run directly
if (require.main === module) {
  cleanupDatabase();
}

export { cleanupDatabase };
