import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('ticket_setups')
export class TicketSetup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'guild_id', unique: true })
  guildId: string;

  @Column({ name: 'channel_id' })
  channelId: string;

  @Column({ name: 'message_id' })
  messageId: string;

  @Column({ name: 'embed_title', default: 'Créer un ticket' })
  embedTitle: string;

  @Column({ name: 'embed_description', type: 'text', nullable: true })
  embedDescription?: string;

  @Column({ name: 'embed_color', default: '#0099FF' })
  embedColor: string;

  @Column({ name: 'buttons_config', type: 'json' })
  buttonsConfig: TicketButtonConfig[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

export interface TicketButtonConfig {
  id: string;
  label: string;
  emoji?: string;
  style: number;
  categoryId?: string;
}
