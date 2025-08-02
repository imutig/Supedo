import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('role_requests')
export class RoleRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'role_id' })
  roleId: string;

  @Column({ name: 'guild_id' })
  guildId: string;

  @Column({
    name: 'request_type',
    type: 'enum',
    enum: ['add', 'remove'],
    default: 'add'
  })
  requestType: 'add' | 'remove';

  @Column({ name: 'message_id', nullable: true })
  messageId?: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'approved', 'denied'],
    default: 'pending'
  })
  status: 'pending' | 'approved' | 'denied';

  @Column({ name: 'approver_id', nullable: true })
  approverId?: string;

  @Column({ name: 'approval_reason', type: 'text', nullable: true })
  approvalReason?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
