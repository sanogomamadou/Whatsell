import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { registerSchema, loginSchema, RegisterDto, LoginDto } from '@whatsell/shared';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from './strategies/jwt.strategy';
import { AuthService } from './auth.service';

const COOKIE_BASE = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict' as const,
} as const;

const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000;         // 15 min en ms
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 jours en ms

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(registerSchema))
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const tokens = await this.authService.register(dto);
    this.setCookies(res, tokens);
    return { message: 'Compte créé avec succès' };
  }

  @Post('login')
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const tokens = await this.authService.login(dto);
    this.setCookies(res, tokens);
    return { message: 'Connexion réussie' };
  }

  @Post('refresh')
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const rawRefreshToken = req.cookies?.['refresh_token'] as string | undefined;
    if (!rawRefreshToken) {
      throw new UnauthorizedException('Refresh token absent');
    }

    const tokens = await this.authService.refresh(rawRefreshToken);
    this.setCookies(res, tokens);
    return { message: 'Token renouvelé' };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(
    @CurrentUser() user: AuthUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    await this.authService.logout(user.id);
    res.clearCookie('access_token', COOKIE_BASE);
    res.clearCookie('refresh_token', COOKIE_BASE);
    return { message: 'Déconnexion réussie' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }

  private setCookies(
    res: Response,
    tokens: { accessToken: string; refreshToken: string },
  ): void {
    res.cookie('access_token', tokens.accessToken, {
      ...COOKIE_BASE,
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });
    res.cookie('refresh_token', tokens.refreshToken, {
      ...COOKIE_BASE,
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });
  }
}
