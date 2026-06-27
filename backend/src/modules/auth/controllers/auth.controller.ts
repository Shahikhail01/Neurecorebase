import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
  Get,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiCommon } from '../../../common/decorators/api-common.decorator';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { GoogleSignInDto } from '../dto/google-signin.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import type { ValidatedUser } from '../interfaces/auth.interface';
import type { Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Controller({ path: 'auth', version: '1' })
@ApiCommon('controllers')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  private readonly googleClientId: string;

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    this.googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID', '');
  }

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register({
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role,
      tenantId: dto.tenantId,
    });
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    this.logger.debug(`Login attempt: ${JSON.stringify(dto)}`);
    return this.authService.login(dto.email, dto.password, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Public()
  @Post('google')
  @HttpCode(HttpStatus.OK)
  async googleSignIn(@Body() dto: GoogleSignInDto & { intent?: 'signin' | 'link' }) {
    const payload = await this.verifyGoogleToken(dto.idToken);
    return this.authService.googleSignIn(
      {
        googleId: payload.sub,
        email: payload.email,
        firstName: payload.given_name,
        lastName: payload.family_name,
        googlePicture: payload.picture,
      },
      { intent: dto.intent ?? 'signin' },
    );
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@CurrentUser() user: ValidatedUser & { jti?: string }) {
    await this.authService.logout(user.id, user.jti ?? '');
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: ValidatedUser) {
    return user;
  }

  /** Alias for /me — satisfies spec requirement for GET /auth/profile */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  profile(@CurrentUser() user: ValidatedUser) {
    return user;
  }

  private async verifyGoogleToken(idToken: string): Promise<GoogleTokenPayload> {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`,
    );
    if (!res.ok) {
      throw new UnauthorizedException('Invalid Google ID token');
    }
    const payload = (await res.json()) as GoogleTokenPayload;
    if (payload.aud !== this.googleClientId) {
      throw new UnauthorizedException('Google ID token audience mismatch');
    }
    return payload;
  }
}

interface GoogleTokenPayload {
  sub: string;
  email: string;
  given_name: string;
  family_name: string;
  picture?: string;
  aud: string;
}
