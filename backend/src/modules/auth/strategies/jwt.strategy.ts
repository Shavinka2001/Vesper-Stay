import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { RequestUser } from '@common/interfaces/authenticated-request.interface';
import { AuthService } from '@modules/auth/auth.service';
import type { JwtPayload } from '@modules/auth/interfaces/auth.interfaces';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('jwt.secret'),
    });
  }

  async validate(payload: JwtPayload): Promise<RequestUser> {
    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid access token payload');
    }

    return this.authService.validateUserById(payload.sub);
  }
}
