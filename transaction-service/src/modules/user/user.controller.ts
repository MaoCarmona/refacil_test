import { Controller, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':userId/balance')
  @ApiOperation({ summary: 'Obtener balance del usuario' })
  @ApiResponse({ status: 200, description: 'Balance retornado' })
  async getUserBalance(@Param('userId') userId: string) {
    try {
      return await this.userService.getUserBalance(userId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error al obtener el balance del usuario',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

