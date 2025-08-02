// MySQL database implementation using TypeORM
import { Repository } from 'typeorm';
import { AppDataSource } from './dataSource';
import { RoleRequest } from './entities/RoleRequest';
import { TicketSetup, TicketButtonConfig } from './entities/TicketSetup';
import { Ticket } from './entities/Ticket';
import { RoleGroup, RoleConfig } from './entities/RoleGroup';
import { TicketCategory } from './entities/TicketCategory';
import { TicketPanel } from './entities/TicketPanel';

// Repository instances
let roleRequestRepository: Repository<RoleRequest>;
let ticketSetupRepository: Repository<TicketSetup>;
let ticketRepository: Repository<Ticket>;
let roleGroupRepository: Repository<RoleGroup>;
let ticketCategoryRepository: Repository<TicketCategory>;
let ticketPanelRepository: Repository<TicketPanel>;

// Initialize repositories after database connection
export const initializeRepositories = (): void => {
  roleRequestRepository = AppDataSource.getRepository(RoleRequest);
  ticketSetupRepository = AppDataSource.getRepository(TicketSetup);
  ticketRepository = AppDataSource.getRepository(Ticket);
  roleGroupRepository = AppDataSource.getRepository(RoleGroup);
  ticketCategoryRepository = AppDataSource.getRepository(TicketCategory);
  ticketPanelRepository = AppDataSource.getRepository(TicketPanel);
};

// Role Request Database Operations
export class RoleRequestDB {
  static async create(data: {
    userId: string;
    roleId: string;
    guildId: string;
    messageId?: string;
  }): Promise<RoleRequest> {
    const roleRequest = roleRequestRepository.create(data);
    return await roleRequestRepository.save(roleRequest);
  }

  static async findByUserAndRole(userId: string, roleId: string): Promise<RoleRequest | null> {
    return await roleRequestRepository.findOne({
      where: { userId, roleId }
    });
  }

  static async findPendingByGuild(guildId: string): Promise<RoleRequest[]> {
    return await roleRequestRepository.find({
      where: { guildId, status: 'pending' }
    });
  }

  static async updateStatus(id: number, status: 'approved' | 'denied', approverId?: string, reason?: string): Promise<void> {
    await roleRequestRepository.update(id, {
      status,
      approverId,
      approvalReason: reason
    });
  }

  static async updateMessageId(id: number, messageId: string): Promise<void> {
    await roleRequestRepository.update(id, {
      messageId
    });
  }

  static async findById(id: number): Promise<RoleRequest | null> {
    return await roleRequestRepository.findOne({
      where: { id }
    });
  }

  static async delete(id: number): Promise<void> {
    await roleRequestRepository.delete(id);
  }
}

// Ticket Setup Database Operations
export class TicketSetupDB {
  static async create(data: {
    guildId: string;
    channelId: string;
    messageId: string;
    embedTitle?: string;
    embedDescription?: string;
    embedColor?: string;
    buttonsConfig: TicketButtonConfig[];
  }): Promise<TicketSetup> {
    const ticketSetup = ticketSetupRepository.create({
      ...data,
      embedTitle: data.embedTitle || 'Create a Ticket',
      embedDescription: data.embedDescription || 'Click the button below to create a support ticket.',
      embedColor: data.embedColor || '#0099FF'
    });
    return await ticketSetupRepository.save(ticketSetup);
  }

  static async findByGuild(guildId: string): Promise<TicketSetup | null> {
    return await ticketSetupRepository.findOne({
      where: { guildId }
    });
  }

  static async update(guildId: string, data: Partial<TicketSetup>): Promise<void> {
    await ticketSetupRepository.update({ guildId }, data);
  }

  static async delete(guildId: string): Promise<void> {
    await ticketSetupRepository.delete({ guildId });
  }
}

// Ticket Database Operations
export class TicketDB {
  static async create(data: {
    ticketId: string;
    userId: string;
    guildId: string;
    channelId: string;
    ticketType: string;
    categoryId?: string;
  }): Promise<Ticket> {
    const ticket = ticketRepository.create(data);
    return await ticketRepository.save(ticket);
  }

  static async findByTicketId(ticketId: string): Promise<Ticket | null> {
    return await ticketRepository.findOne({
      where: { ticketId }
    });
  }

  static async findOpenByUser(userId: string, guildId: string): Promise<Ticket[]> {
    return await ticketRepository.find({
      where: { userId, guildId, status: 'open' }
    });
  }

  static async findByChannel(channelId: string): Promise<Ticket | null> {
    return await ticketRepository.findOne({
      where: { channelId }
    });
  }

  static async findByGuild(guildId: string): Promise<Ticket[]> {
    return await ticketRepository.find({
      where: { guildId }
    });
  }

  static async closeTicket(ticketId: string, closedBy: string, reason?: string): Promise<void> {
    await ticketRepository.update(
      { ticketId },
      {
        status: 'closed',
        closedBy,
        closeReason: reason,
        closedAt: new Date()
      }
    );
  }

  static async delete(ticketId: string): Promise<void> {
    await ticketRepository.delete({ ticketId });
  }
}

// Role Group Database Operations
export class RoleGroupDB {
  static async create(data: {
    guildId: string;
    groupName: string;
    rolesConfig: RoleConfig[];
    requiredRoleId?: string;
    requiredRoleName?: string;
    description?: string;
  }): Promise<RoleGroup> {
    const roleGroup = roleGroupRepository.create(data);
    return await roleGroupRepository.save(roleGroup);
  }

  static async findByName(guildId: string, groupName: string): Promise<RoleGroup | null> {
    return await roleGroupRepository.findOne({
      where: { guildId, groupName }
    });
  }

  static async findByGuild(guildId: string): Promise<RoleGroup[]> {
    return await roleGroupRepository.find({
      where: { guildId }
    });
  }

  static async update(id: number, data: Partial<RoleGroup>): Promise<void> {
    await roleGroupRepository.update(id, data);
  }

  static async delete(id: number): Promise<void> {
    await roleGroupRepository.delete(id);
  }
}

// Ticket Category Database Operations
export class TicketCategoryDB {
  static async create(data: {
    guildId: string;
    categoryKey: string;
    categoryName: string;
    buttonLabel: string;
    buttonEmoji?: string;
    buttonStyle?: number;
    discordCategoryId?: string;
    openMessage?: string;
  }): Promise<TicketCategory> {
    const ticketCategory = ticketCategoryRepository.create(data);
    return await ticketCategoryRepository.save(ticketCategory);
  }

  static async findByGuild(guildId: string): Promise<TicketCategory[]> {
    return await ticketCategoryRepository.find({
      where: { guildId, isActive: true }
    });
  }

  static async findByCategoryKey(guildId: string, categoryKey: string): Promise<TicketCategory | null> {
    return await ticketCategoryRepository.findOne({
      where: { guildId, categoryKey }
    });
  }

  static async findById(id: number): Promise<TicketCategory | null> {
    return await ticketCategoryRepository.findOne({
      where: { id }
    });
  }

  static async update(id: number, data: Partial<TicketCategory>): Promise<void> {
    await ticketCategoryRepository.update(id, data);
  }

  static async delete(id: number): Promise<void> {
    await ticketCategoryRepository.delete(id);
  }

  static async setActive(id: number, isActive: boolean): Promise<void> {
    await ticketCategoryRepository.update(id, { isActive });
  }
}

// Ticket Panel Database Operations
export class TicketPanelDB {
  static async create(data: {
    guildId: string;
    channelId: string;
    messageId: string;
    panelTitle?: string;
    panelDescription?: string;
    panelColor?: number;
    createdBy: string;
  }): Promise<TicketPanel> {
    const ticketPanel = ticketPanelRepository.create(data);
    return await ticketPanelRepository.save(ticketPanel);
  }

  static async findByGuild(guildId: string): Promise<TicketPanel[]> {
    return await ticketPanelRepository.find({
      where: { guildId, isActive: true },
      order: { createdAt: 'DESC' }
    });
  }

  static async findByMessageId(messageId: string): Promise<TicketPanel | null> {
    return await ticketPanelRepository.findOne({
      where: { messageId }
    });
  }

  static async findById(id: number): Promise<TicketPanel | null> {
    return await ticketPanelRepository.findOne({
      where: { id }
    });
  }

  static async update(id: number, data: Partial<TicketPanel>): Promise<void> {
    await ticketPanelRepository.update(id, data);
  }

  static async delete(id: number): Promise<void> {
    await ticketPanelRepository.delete(id);
  }

  static async setActive(id: number, isActive: boolean): Promise<void> {
    await ticketPanelRepository.update(id, { isActive });
  }
}

// Export types for backward compatibility
export { RoleRequest, TicketSetup, Ticket, RoleGroup, TicketButtonConfig, RoleConfig, TicketCategory, TicketPanel };
