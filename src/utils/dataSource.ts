import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { RoleRequest } from './entities/RoleRequest';
import { TicketSetup } from './entities/TicketSetup';
import { Ticket } from './entities/Ticket';
import { RoleGroup } from './entities/RoleGroup';

config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'supedo_bot',
  ssl: process.env.DB_SSL === 'true',
  synchronize: true, // Set to false in production
  logging: false,
  entities: [RoleRequest, TicketSetup, Ticket, RoleGroup],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: ['src/subscribers/**/*.ts'],
});

// Initialize database connection
export const initializeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log('[INFO] Database connection established successfully');
  } catch (error) {
    console.error('[ERROR] Failed to connect to database:', error);
    process.exit(1);
  }
};
