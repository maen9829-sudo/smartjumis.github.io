import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private config: ConfigService,
  ) {}

  // ─── POST /api/auth/register ───────────────────────────────────────────────
  // Returns: { accessToken, refreshToken, expiresIn, user }
  @Post('register')
  register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto, {
      userAgent: req.headers['user-agent'],
      ip:        req.ip,
    });
  }

  // ─── POST /api/auth/login ──────────────────────────────────────────────────
  // Returns: { accessToken, refreshToken, expiresIn, user }
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, {
      userAgent: req.headers['user-agent'],
      ip:        req.ip,
    });
  }

  // ─── POST /api/auth/refresh ────────────────────────────────────────────────
  // Body: { refreshToken: "..." }
  // Returns: new { accessToken, refreshToken, expiresIn, user }
  // Old refresh token is immediately invalidated (rotation)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    return this.authService.refresh(dto.refreshToken, {
      userAgent: req.headers['user-agent'],
      ip:        req.ip,
    });
  }

  // ─── POST /api/auth/logout ─────────────────────────────────────────────────
  // Body: { refreshToken: "..." }  — revokes this specific session
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refreshToken);
  }

  // ─── POST /api/auth/logout-all ────────────────────────────────────────────
  // Revokes ALL sessions for the current user (requires valid access token)
  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  logoutAll(@CurrentUser() user: { id: string }) {
    return this.authService.logoutAll(user.id);
  }

  // ─── GET /api/auth/me ──────────────────────────────────────────────────────
  // Returns full user profile + unread notification count
  // Used on app startup to rehydrate frontend state
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentUser() user: { id: string }) {
    return this.authService.getMe(user.id);
  }

  // ─── GET /api/auth/google ──────────────────────────────────────────────────
  // Redirects browser to Google consent screen
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    // Passport handles the OAuth redirect automatically
  }

  // ─── GET /api/auth/google/callback ────────────────────────────────────────
  // Google redirects here after user grants permission
  // We redirect to frontend with tokens in query params
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: any, @Res() res: Response) {
    const result = await this.authService.googleLogin(req.user, {
      userAgent: req.headers['user-agent'],
      ip:        req.ip,
    });

    const frontendUrl = this.config.get<string>('FRONTEND_URL');

    // Pass BOTH tokens to frontend via URL params
    // Frontend: reads params, stores in localStorage, redirects to dashboard
    const params = new URLSearchParams({
      accessToken:  result.accessToken,
      refreshToken: result.refreshToken,
    });

    res.redirect(`${frontendUrl}/auth/callback?${params.toString()}`);
  }
}
