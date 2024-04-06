import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { OneAPIUser } from './entities/user.entity';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(OneAPIUser)
    private readonly usersRepository: Repository<OneAPIUser>,
  ) {}
  async create(createUserDto: CreateUserDto) {
    return await this.usersRepository.save(createUserDto);
  }

  findAll() {
    return this.usersRepository.find();
  }

  findOne(id: number) {
    return this.usersRepository.findOneBy({ id });
  }
  async findOneByUniId(github_id: string) {
    return await this.usersRepository.findOneBy({ github_id });
  }
  async CreateByUniId(createUserDto: CreateUserDto) {
    const res = await this.findOneByUniId(createUserDto.github_id);
    console.log(res);
    if (res) {
      return res;
    } else {
      return await this.create(createUserDto);
    }
    // return this.usersRepository.findOneBy({ id });
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    this.usersRepository.update(id, updateUserDto);
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    this.usersRepository.delete(id);
    return `This action removes a #${id} user`;
  }
}
