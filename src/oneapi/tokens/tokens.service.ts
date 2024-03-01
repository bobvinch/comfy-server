import { Injectable } from '@nestjs/common';
import { CreateTokenDto } from './dto/create-token.dto';
import { UpdateTokenDto } from './dto/update-token.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Token } from './entities/token.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TokensService {
  constructor(
    @InjectRepository(Token)
    private readonly usersRepository: Repository<Token>,
  ) {}
  async create(createTokenDto: CreateTokenDto) {
    const res = await this.findOne(createTokenDto.user_id);
    console.log(res);
    if (res) {
      return res;
    } else {
      return await this.usersRepository.save(createTokenDto);
    }

    // return 'This action adds a new token';
  }

  findAll() {
    return `This action returns all tokens`;
  }

  async findOne(id: number) {
    return await this.usersRepository.findOneBy({ user_id: id });
  }

  update(id: number, updateTokenDto: UpdateTokenDto) {
    return `This action updates a #${id} token`;
  }

  remove(id: number) {
    return `This action removes a #${id} token`;
  }
}
