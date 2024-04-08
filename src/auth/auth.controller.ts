import { AuthService } from './auth.service';
import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  @ApiOperation({
    summary: '鉴权',
    description: 'Sign in with username and password,returning a token',
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              username: {
                type: 'string',
                example: 'admin',
              },
              password: {
                type: 'string',
                example: 'your password',
              },
            },
          },
        },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  @Post('signin')
  signIn(@Body() signInDto: Record<string, any>) {
    return this.authService.authToken(signInDto.username, signInDto.password);
  }
}
