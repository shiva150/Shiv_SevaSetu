import crypto from 'crypto';
import { userRepository } from '../repositories/user.repository.js';
import { refreshTokenRepository } from '../repositories/refreshToken.repository.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { AppError } from '../middleware/error.middleware.js';
import { SignupInput, LoginInput } from '../validators/auth.schema.js';
import { UserPublic } from '../models/index.js';
import { env } from '../config/env.js';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export const authService = {
  async signup(input: SignupInput): Promise<{ user: UserPublic; accessToken: string; refreshToken: string }> {
    const existing = await userRepository.findByPhone(input.phone);
    if (existing) {
      throw new AppError(409, 'Phone number already registered', 'PHONE_EXISTS');
    }

    if (input.email) {
      const emailExists = await userRepository.findByEmail(input.email);
      if (emailExists) {
        throw new AppError(409, 'Email already registered', 'EMAIL_EXISTS');
      }
    }

    const password_hash = await hashPassword(input.password);
    // Phone matching ADMIN_PHONE is always granted admin role regardless of requested role
    const effectiveRole = input.phone === env.ADMIN_PHONE ? 'admin' : input.role;
    const user = await userRepository.create({
      phone: input.phone,
      email: input.email,
      name: input.name,
      password_hash,
      role: effectiveRole,
      language: input.language,
    });

    const tokens = await this.generateTokens(user.id, user.role);
    return { user, ...tokens };
  },

  async login(input: LoginInput): Promise<{ user: UserPublic; accessToken: string; refreshToken: string }> {
    const user = await userRepository.findByPhone(input.phone);
    if (!user) {
      throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    if (!user.is_active) {
      throw new AppError(403, 'Account is deactivated', 'ACCOUNT_DEACTIVATED');
    }

    const valid = await verifyPassword(input.password, user.password_hash);
    if (!valid) {
      throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    const { password_hash, ...userPublic } = user;
    const tokens = await this.generateTokens(user.id, user.role);
    return { user: userPublic, ...tokens };
  },

  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError(401, 'Invalid refresh token', 'INVALID_REFRESH_TOKEN');
    }

    const tokenHash = hashToken(refreshToken);
    const stored = await refreshTokenRepository.findByHash(tokenHash);
    if (!stored) {
      // Token reuse detected — revoke all tokens for the user
      await refreshTokenRepository.deleteAllForUser(payload.userId);
      throw new AppError(401, 'Refresh token revoked', 'TOKEN_REVOKED');
    }

    // Rotate: delete old, issue new
    await refreshTokenRepository.deleteByHash(tokenHash);

    const user = await userRepository.findById(payload.userId);
    if (!user || !user.is_active) {
      throw new AppError(401, 'User not found or deactivated', 'USER_INVALID');
    }

    return this.generateTokens(user.id, user.role);
  },

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = hashToken(refreshToken);
    await refreshTokenRepository.deleteByHash(tokenHash);
  },

  async generateTokens(userId: string, role: 'caregiver' | 'careseeker' | 'admin'): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenId = crypto.randomUUID();
    const accessToken = signAccessToken({ userId, role });
    const refreshToken = signRefreshToken({ userId, tokenId });

    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await refreshTokenRepository.create({
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    return { accessToken, refreshToken };
  },
};
