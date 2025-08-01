// MySQL database implementation using TypeORM
import { Repository } from 'typeorm';
import { AppDataSource } from './dataSource';
import { RoleRequest } from './entities/RoleRequest';
import { TicketSetup, TicketButtonConfig } from './entities/TicketSetup';
import { Ticket } from './entities/Ticket';
import { RoleGroup, RoleConfig } from './entities/RoleGroup';

// Repository instances
let roleRequestRepository: Repository<RoleRequest>;
let ticketSetupRepository: Repository<TicketSetup>;
let ticketRepository: Repository<Ticket>;
let roleGroupRepository: Repository<RoleGroup>;

// Initialize repositories after database connection
export const initializeRepositories = (): void => {
  roleRequestRepository = AppDataSource.getRepository(RoleRequest);
  ticketSetupRepository = AppDataSource.getRepository(TicketSetup);
  ticketRepository = AppDataSource.getRepository(Ticket);
  roleGroupRepository = AppDataSource.getRepository(RoleGroup);
};

// Role Request Database Operations
export class RoleRequestDB {
  static async create(data: {
    userId: string;
    roleId: string;
    guildId: string;
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
    const ticketSetup = ticketSetupRepository.create(data);
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

// Export types for backward compatibility
export { RoleRequest, TicketSetup, Ticket, RoleGroup, TicketButtonConfig, RoleConfig };
