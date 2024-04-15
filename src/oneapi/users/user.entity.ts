import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
  PrimaryColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'users' })
export class OneAPIUser extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @ApiProperty({
    description: 'username',
    example: 'zhangsan',
  })
  @Column()
  username: string;
  @ApiProperty({
    description: 'password',
    example: '123456',
  })
  @Column()
  password: string;
  @ApiProperty({
    description: '余额',
    example: '123456',
  })
  @Column()
  quota: number;
  @ApiProperty({
    description: '显示名称',
    example: 'zhangsan',
  })
  @Column({ nullable: true })
  display_name: string;
  @ApiProperty({
    description: '角色编号',
    example: '1',
  })
  @Column({ nullable: true })
  role: number;
  @ApiProperty({
    description: '状态',
    example: '1',
  })
  @Column({ nullable: true })
  status: number;
  @ApiProperty({
    description: '邮箱',
    example: 'nnheo@example.com',
  })
  @Column({ nullable: true })
  email: string;
  @ApiProperty({
    description: 'unionid',
    example: 'wxc1234567890',
  })
  @Column({ nullable: true })
  github_id: string; //用户唯一标识,微信uniid
  @ApiProperty({
    description: 'openid',
    example: 'wxopenidc1234567890',
  })
  @Column({ nullable: true })
  wechat_id: string;
  @ApiProperty({
    description: 'access_token',
    example: 'toen1234567890',
  })
  @Column({ nullable: true })
  access_token: string;
  @ApiProperty({
    description: '已使用流量',
    example: 100,
  })
  @Column({ nullable: true })
  used_quota: number;
  @ApiProperty({
    description: '请求次数',
    example: 100,
  })
  @Column({ nullable: true })
  request_count: number;
  @ApiProperty({
    description: '分组',
    example: '100',
  })
  @Column({ nullable: true })
  group: string;
  @Column({ nullable: true })
  aff_code: string;
  @Column({ nullable: true })
  inviter_id: number;
}
