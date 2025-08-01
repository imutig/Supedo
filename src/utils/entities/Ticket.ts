import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'ticket_id', unique: true })
  ticketId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'guild_id' })
  guildId: string;

  @Column({ name: 'channel_id' })
  channelId: string;

  @Column({ name: 'category_id', nullable: true })
  categoryId?: string;

  @Column({ name: 'ticket_type' })
  ticketType: string;

  @Column({
    type: 'enum',
    enum: ['open', 'closed'],
    default: 'open'
  })
  status: 'open' | 'closed';

  @Column({ name: 'closed_by', nullable: true })
  closedBy?: string;

  @Column({ name: 'close_reason', type: 'text', nullable: true })
  closeReason?: string;

  @Column({ name: 'closed_at', nullable: true })
  closedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
