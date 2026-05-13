import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

// Token lifetimes
const ACCESS_TOKEN_EXPIRES  = '15m';   // short-lived access token
const REFRESH_TOKEN_EXPIRES = '30d';   // long-lived refresh token
const REFRESH_TOKEN_BYTES   = 64;      // raw token length

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  // ─── Register ─────────────────────────────────────────────────────────────
  async register(dto: RegisterDto, meta?: { userAgent?: string; ip?: string }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email:        dto.email,
        passwordHash,
        name:         dto.name,
        city:         dto.city,
      },
      select: { id: true, email: true, name: true, avatarUrl: true },
    });

    return this.issueTokens(user.id, user.email, meta);
  }

  // ─── Login ────────────────────────────────────────────────────────────────
  async login(dto: LoginDto, meta?: { userAgent?: string; ip?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    return this.issueTokens(user.id, user.email, meta);
  }

  // ─── Google OAuth ─────────────────────────────────────────────────────────
  async googleLogin(
    googleUser: { googleId: string; email: string; name: string; avatarUrl?: string },
    meta?: { userAgent?: string; ip?: string },
  ) {
    let user = await this.prisma.user.findFirst({
      where: { OR: [{ googleId: googleUser.googleId }, { email: googleUser.email }] },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          googleId:  googleUser.googleId,
          email:     googleUser.email,
          name:      googleUser.name,
          avatarUrl: googleUser.avatarUrl,
        },
      });
    } else if (!user.googleId) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { googleId: googleUser.googleId, avatarUrl: googleUser.avatarUrl },
      });
    }

    return this.issueTokens(user.id, user.email, meta);
  }

  // ─── Refresh Access Token ─────────────────────────────────────────────────
  // Client sends refresh token → gets new access token + new refresh token
  async refresh(rawRefreshToken: string, meta?: { userAgent?: string; ip?: string }) {
    // Hash the incoming token to look it up in DB
    const tokenHash = this.hashToken(rawRefreshToken);

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { id: true, email: true } } },
    });

    // Token not found, expired, or tampered
    if (!stored || stored.expiresAt < new Date()) {
      // If found but expired — clean it up
      if (stored) {
        await this.prisma.refreshToken.delete({ where: { id: stored.id } });
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Rotate: delete old token, issue brand new pair (prevents replay attacks)
    await this.prisma.refreshToken.delete({ where: { id: stored.id } });

    return this.issueTokens(stored.user.id, stored.user.email, meta);
  }

  // ─── Logout (revoke refresh token) ────────────────────────────────────────
  async logout(rawRefreshToken: string) {
    const tokenHash = this.hashToken(rawRefreshToken);

    await this.prisma.refreshToken.deleteMany({ where: { tokenHash } });

    return { success: true };
  }

  // ─── Logout all sessions ──────────────────────────────────────────────────
  async logoutAll(userId: string) {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    return { success: true };
  }

  // ─── Get current user profile ─────────────────────────────────────────────
  async getMe(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id:        true,
        email:     true,
        name:      true,
        avatarUrl: true,
        phone:     true,
        city:      true,
        createdAt: true,
        // Count active projects and orders for the dashboard header
        _count: {
          select: {
            projects:      true,
            notifications: { where: { isRead: false } },
          },
        },
      },
    });
  }

  // ─── Core: issue access + refresh token pair ──────────────────────────────
  private async issueTokens(
    userId: string,
    email: string,
    meta?: { userAgent?: string; ip?: string },
  ) {
    // 1. Sign short-lived access token (JWT)
    const accessToken = this.jwt.sign(
      { sub: userId, email },
      { expiresIn: ACCESS_TOKEN_EXPIRES },
    );

    // 2. Generate cryptographically random refresh token
    const rawRefreshToken = crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
    const tokenHash       = this.hashToken(rawRefreshToken);

    // 3. Persist hashed refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        userId,
        expiresAt,
        userAgent: meta?.userAgent,
        ipAddress: meta?.ip,
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken, // raw token sent to client, never stored plain
      expiresIn:    15 * 60,         // seconds — helps frontend schedule refresh
      user: { id: userId, email },
    };
  }

  // ─── SHA-256 hash of raw token for DB storage ─────────────────────────────
  private hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }
}
