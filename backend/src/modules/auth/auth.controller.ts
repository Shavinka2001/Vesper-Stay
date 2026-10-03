import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Public } from '@common/decorators/public.decorator';
import type { RequestUser } from '@common/interfaces/authenticated-request.interface';
import { AuthService } from '@modules/auth/auth.service';
import { LoginDto } from '@modules/auth/dto/login.dto';
import { RegisterPropertyDto } from '@modules/auth/dto/register-property.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register-property')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new property (tenant) and hotel owner account',
  })
  @ApiCreatedResponse({
    description: 'Property and owner created; JWT access token issued',
  })
  registerProperty(@Body() dto: RegisterPropertyDto) {
    return this.authService.registerProperty(dto);
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate staff user and issue JWT' })
  @ApiOkResponse({ description: 'Credentials valid; JWT access token issued' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials or inactive user' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Return the authenticated user and primary property context',
  })
  @ApiOkResponse({ description: 'Current user and property metadata' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Bearer token' })
  me(@CurrentUser() user: RequestUser) {
    return this.authService.getMe(user);
  }
}
