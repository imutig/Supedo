import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export interface TicketCategoryConfig {
  id: string;
  label: string;
  emoji?: string;
  style: number;
  categoryId?: string;
  openMessage?: string;
}

@Entity('ticket_categories')
export class TicketCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'guild_id' })
  guildId: string;

  @Column({ name: 'category_key', unique: true })
  categoryKey: string;

  @Column({ name: 'category_name' })
  categoryName: string;

  @Column({ name: 'button_label' })
  buttonLabel: string;

  @Column({ name: 'button_emoji', nullable: true })
  buttonEmoji?: string;

  @Column({ name: 'button_style', default: 1 })
  buttonStyle: number;

  @Column({ name: 'discord_category_id', nullable: true })
  discordCategoryId?: string;

  @Column({ name: 'open_message', type: 'text', nullable: true })
  openMessage?: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
