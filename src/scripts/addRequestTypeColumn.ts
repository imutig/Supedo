import { AppDataSource } from '../utils/dataSource';

async function addRequestTypeColumn() {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established');

    // Check if the column already exists
    const queryRunner = AppDataSource.createQueryRunner();
    
    const tableExists = await queryRunner.hasTable('role_requests');
    if (!tableExists) {
      console.log('Table role_requests does not exist yet, skipping migration');
      await queryRunner.release();
      await AppDataSource.destroy();
      return;
    }

    const columnExists = await queryRunner.hasColumn('role_requests', 'request_type');
    if (columnExists) {
      console.log('Column request_type already exists, skipping migration');
      await queryRunner.release();
      await AppDataSource.destroy();
      return;
    }

    // Add the request_type column
    await queryRunner.query(`
      ALTER TABLE role_requests 
      ADD COLUMN request_type ENUM('add', 'remove') NOT NULL DEFAULT 'add'
    `);

    console.log('[INFO] Colonne request_type ajoutée avec succès à la table role_requests');
    
    await queryRunner.release();
    await AppDataSource.destroy();
    
  } catch (error) {
    console.error('[ERREUR] Erreur lors de l\'ajout de la colonne request_type :', error);
    process.exit(1);
  }
}

addRequestTypeColumn();
