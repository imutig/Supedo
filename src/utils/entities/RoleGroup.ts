import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('role_groups')
export class RoleGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'guild_id' })
  guildId: string;

  @Column({ name: 'group_name' })
  groupName: string;

  @Column({ name: 'roles_config', type: 'json' })
  rolesConfig: RoleConfig[];

  @Column({ name: 'required_role_id', nullable: true })
  requiredRoleId?: string;

  @Column({ name: 'required_role_name', nullable: true })
  requiredRoleName?: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

export interface RoleConfig {
  id: string;
  name: string;
}
