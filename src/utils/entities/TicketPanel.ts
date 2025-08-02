import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('ticket_panels')
export class TicketPanel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'guild_id' })
  guildId: string;

  @Column({ name: 'channel_id' })
  channelId: string;

  @Column({ name: 'message_id' })
  messageId: string;

  @Column({ name: 'panel_title', default: 'Système de tickets' })
  panelTitle: string;

  @Column({ name: 'panel_description', type: 'text', nullable: true })
  panelDescription?: string;

  @Column({ name: 'panel_color', default: 0x0099FF })
  panelColor: number;

  @Column({ name: 'created_by' })
  createdBy: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
