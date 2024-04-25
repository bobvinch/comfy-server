import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schema/user.schema';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

/**
 * 注册结果消息接口
 */
export type RegistRes = {
  status: number;
  msg: string;
  data: User;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 注意，账号创建不做用户验证
   * @param createUserDto
   */
  async create(createUserDto: CreateUserDto) {
    //根据username查找用户是否存在
    // let user;
    // // 用户存在
    // if (createUserDto.username) {
    //   user = await this.findByUsername(createUserDto.username);
    // }
    // // 微信ID存在
    // if (createUserDto.wx_unionid) {
    //   user = await this.findByWxUnionid(createUserDto.wx_unionid);
    // }
    // // 邮箱存在
    // if (createUserDto.email) {
    //   user = await this.findByEmail(createUserDto.email);
    // }
    // if (user) {
    //   console.log('user:', user);
    //   return user;
    // }
    //根据email查找用户是否存在
    // const emailUser = await this.findByEmail(createUserDto.email);
    // if (emailUser) {
    //   console.log('emailUser:', emailUser);
    //   return emailUser;
    // }
    createUserDto.password = await this.hashPassword(createUserDto.password);
    const createdUser = new this.userModel(createUserDto);
    return createdUser.save();
  }

  /**
   * 注册
   */
  async registerByUsername(createUserDto: CreateUserDto) {
    const { username } = createUserDto;
    console.log(username);
    if (username) {
      const user = await this.findByUsername(username);
      console.log(user);
      if (user) {
        return {
          status: 1,
          msg: '用户名已存在',
          data: null,
        } as RegistRes;
      }
      const createdUser = await this.create(createUserDto);
      //更新token，并返回User
      await this.updateToken(createdUser._id, createdUser.username);
      return {
        status: 0,
        msg: '注册成功',
        data: await this.findOne(createdUser._id + ''),
      } as RegistRes;
    }
  }

  /**
   * 根据unionid实现微信登录，如果不存在就创建账号
   * @param createUserDto
   */
  async loginBywechat(createUserDto: CreateUserDto) {
    const res = await this.findByWxUnionid(createUserDto.wx_unionid);
    return res ? res : await this.create(createUserDto);
  }

  /**
   * login,通过账号密码登录
   */
  async loginByUsername(createUserDto: CreateUserDto) {
    const { username, password } = createUserDto;
    const user = await this.findByUsername(username);
    if (!user) {
      return {
        status: 1,
        msg: '用户名不存在',
        data: null,
      } as RegistRes;
    }
    const isMatch = await this.comparePassword(password, user.password);
    if (!isMatch) {
      return {
        status: 1,
        msg: '密码错误',
        data: null,
      } as RegistRes;
    }
    return {
      status: 0,
      msg: '登录成功',
      data: await this.updateToken(user._id, user.username),
    } as RegistRes;
  }

  /**
   * 根据加密的密码和实现自动登录
   */
  async autoLogin(user: User) {
    const { password } = user;
  }

  findAll() {
    return this.userModel.find().exec();
  }

  findOne(id: string) {
    return this.userModel.findById(id).exec();
  }

  async findByUsername(username: string) {
    return await this.userModel.findOne({ username }).exec();
  }

  async findByEmail(email: string) {
    return await this.userModel.findOne({ email }).exec();
  }

  async findByWxUnionid(wx_unionid: string) {
    return await this.userModel.findOne({ wx_unionid }).exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    // const updateUser = new this.userModel(updateUserDto);
    return await this.userModel.findByIdAndUpdate(id, updateUserDto);
  }

  async remove(id: string) {
    return await this.userModel.findByIdAndDelete(id);
  }

  private iv = null as Buffer;
  private key = null as Buffer;

  async hashPassword(password: string) {
    const saltOrRounds = 10;
    return await bcrypt.hash(password, saltOrRounds);
  }

  async comparePassword(password: string, hash: string) {
    try {
      return await bcrypt.compare(password, hash);
    } catch (e) {
      throw new Error(e);
    }
  }

  /**
   * 用户id,用户名生成token
   * @param _id
   * @param username
   */
  async createToken(_id: string, username: string) {
    const payload = {
      sub: _id,
      username,
    };
    return await this.jwtService.signAsync(payload);
  }

  /**
   * 更新token
   * @param _id
   * @param username
   */
  async updateToken(_id, username) {
    return this.userModel.findByIdAndUpdate(_id, {
      token: await this.createToken(_id, username),
    });
  }

  /**
   * 根据token获取用户信息,可以用validateToken替代这个函数功能，也能返回最终的User
   * @param token
   */
  private async getUserInfoByToken(token: string) {
    const payload = await this.jwtService.decode(token);
    return await this.userModel.findById(payload['sub']);
  }

  /**
   * 验证token有效性
   */
  async validateToken(token: string): Promise<User | false> {
    const { sub, exp } = await this.jwtService.decode(token);
    if (exp < Math.floor(Date.now() / 1000)) {
      return false;
    }
    if (!sub) {
      return false;
    }
    return await this.userModel.findById(sub);
  }

}
