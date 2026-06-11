import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {
  ConflictError,
  UnauthorizedError,
} from '../shared/exceptions/domain.exception.js';
import { AuthMapper } from './auth.mapper.js';
import { AuthRepository } from './auth.repository.js';
import { AuthResponseDto } from './dto/auth-response.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

export type Tokens = { accessToken: string; refreshToken: string };
type AuthResult = { user: AuthResponseDto; tokens: Tokens };

@Injectable()
export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly mapper: AuthMapper,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await this.repository.findByUsername(dto.username);
    if (existing) {
      throw new ConflictError('Username already taken');
    }

    const password = await bcrypt.hash(dto.password, 10);
    const avatarUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${dto.username}`;

    const userRecord = await this.repository.create({
      username: dto.username,
      password,
      email: dto.email,
      avatarUrl,
    });

    const user = this.mapper.toResponse(userRecord);
    const tokens = this.generateTokens(userRecord.id, userRecord.username);
    return { user, tokens };
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const userRecord = await this.repository.findByUsername(dto.username);
    if (!userRecord) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(
      dto.password,
      userRecord.password,
    );
    if (!passwordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const user = this.mapper.toResponse(userRecord);
    const tokens = this.generateTokens(userRecord.id, userRecord.username);
    return { user, tokens };
  }

  private generateTokens(userId: string, username: string): Tokens {
    const payload = { sub: userId, username };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET')!,
      expiresIn: this.configService.get(
        'JWT_ACCESS_EXPIRES_IN',
      ) as import('ms').StringValue,
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET')!,
      expiresIn: this.configService.get(
        'JWT_REFRESH_EXPIRES_IN',
      ) as import('ms').StringValue,
    });
    return { accessToken, refreshToken };
  }

  async refreshTokens(token: string): Promise<Tokens> {
    let payload: { sub: string; username: string };
    try {
      payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const userRecord = await this.repository.findById(payload.sub);
    if (!userRecord) {
      throw new UnauthorizedError('User not found');
    }

    return this.generateTokens(userRecord.id, userRecord.username);
  }
}
