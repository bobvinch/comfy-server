import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async authToken(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findByUsername(username);
    if (
      !user ||
      !(await this.usersService.comparePassword(pass, user?.password))
    ) {
      throw new UnauthorizedException();
    }
    return {
      access_token: await this.usersService.createToken(
        user._id + '',
        user.username,
      ),
    };
  }
}
