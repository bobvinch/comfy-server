import { Injectable, Logger } from '@nestjs/common';
import { OneAPIUser } from './entities/user.entity';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class OneAPIUsersService {
  private readonly logger = new Logger(OneAPIUsersService.name);
  constructor(
    @InjectRepository(OneAPIUser)
    private readonly usersRepository: Repository<OneAPIUser>,
  ) {}
  async create(user: OneAPIUser) {
    return await this.usersRepository.save(user);
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

  /**
   * 根据uniid创建用户,如果存在存在返回，没有就创建
   * @param user
   * @constructor
   */
  async CreateByUniId(user: OneAPIUser) {
    //根据id或者用户名查找
    const res =
      (await this.findOneByUniId(user.github_id)) ||
      (await this.usersRepository.findOneBy({
        username: user.username,
      }));
    console.log(res);
    if (res) {
      this.logger.log('用户已存在');
      return res;
    } else {
      this.logger.log('用户不存在，创建用户');
      return await this.create(user);
    }
    // return this.usersRepository.findOneBy({ id });
  }

  update(id: number, user: OneAPIUser) {
    this.usersRepository.update(id, user);
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    this.usersRepository.delete(id);
    return `This action removes a #${id} user`;
  }
}
