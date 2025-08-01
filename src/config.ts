export interface BotConfig {
  // Channel names where role requests will be sent
  roleRequestChannels: string[];
  
  // Default ticket categories
  ticketCategories: {
    general: string;
    technical: string;
    billing: string;
  };
  
  // Roles that can approve any role request (in addition to Manage Roles permission)
  globalApprovers: string[];
  
  // Maximum number of open tickets per user
  maxTicketsPerUser: number;
  
  // Auto-close tickets after inactivity (in milliseconds)
  ticketTimeout: number;
}

export const defaultConfig: BotConfig = {
  roleRequestChannels: ['role-requests', 'mod-log', 'staff-logs'],
  ticketCategories: {
    general: 'General Support',
    technical: 'Technical Issue', 
    billing: 'Billing'
  },
  globalApprovers: ['Administrator', 'Moderator', 'Staff'],
  maxTicketsPerUser: 3,
  ticketTimeout: 24 * 60 * 60 * 1000 // 24 hours
};
