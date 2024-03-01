import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'tokens' })
export class Token {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ nullable: true })
  user_id: number;
  @Column({ nullable: true })
  key: string;
  @Column({ nullable: true })
  status: number;
  @Column({ nullable: true })
  name: string;
  @Column({ nullable: true })
  created_time: number;
  @Column({ nullable: true })
  accessed_time: number;
  @Column({ nullable: true })
  expired_time: number;
  @Column({ nullable: true })
  remain_quota: number;
  @Column({ nullable: true })
  unlimited_quota: boolean;
  @Column({ nullable: true })
  used_quota: number;
}
