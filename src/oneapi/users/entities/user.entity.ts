import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'users' })
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  username: string;
  @Column()
  password: string;
  @Column()
  quota: number;
  @Column({ nullable: true })
  display_name: string;
  @Column({ nullable: true })
  role: number;
  @Column({ nullable: true })
  status: number;
  @Column({ nullable: true })
  email: string;
  @PrimaryColumn()
  github_id: string; //用户唯一标识
  @Column({ nullable: true })
  wechat_id: string;
  @Column({ nullable: true })
  access_token: string;
  @Column({ nullable: true })
  used_quota: number;
  @Column({ nullable: true })
  request_count: number;
  @Column({ nullable: true })
  group: string;
  @Column({ nullable: true })
  aff_code: string;
  @Column({ nullable: true })
  inviter_id: number;
}
