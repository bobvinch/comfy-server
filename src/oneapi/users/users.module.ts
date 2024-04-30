import { Module } from '@nestjs/common';
import { OneAPIUsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OneAPIUser } from './entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OneAPIUser])],
  controllers: [UsersController],
  providers: [OneAPIUsersService],
  exports: [OneAPIUsersService, TypeOrmModule],
})
export class OneAPIUsersModule {}
