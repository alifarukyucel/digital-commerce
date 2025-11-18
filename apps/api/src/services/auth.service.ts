import { prisma } from '@commerce/database';
import { hashPassword, comparePassword } from '../utils/password.utils';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.utils';
import { ApiError } from '../middleware/error.middleware';
import type { SignupRequest, LoginRequest, AuthTokens, AuthUser } from '@commerce/types';

export class AuthService {
  async signup(data: SignupRequest): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { username: data.username },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === data.email) {
        throw new ApiError(409, 'CONFLICT', 'Email already in use');
      }
      throw new ApiError(409, 'CONFLICT', 'Username already taken');
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        username: data.username,
        displayName: data.displayName || data.username,
      },
    });

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
    };

    const tokens = {
      accessToken: generateAccessToken(tokenPayload),
      refreshToken: generateRefreshToken(tokenPayload),
    };

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
      tokens,
    };
  }

  async login(data: LoginRequest): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !user.passwordHash) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Invalid credentials');
    }

    // Verify password
    const isValid = await comparePassword(data.password, user.passwordHash);

    if (!isValid) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Invalid credentials');
    }

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
    };

    const tokens = {
      accessToken: generateAccessToken(tokenPayload),
      refreshToken: generateRefreshToken(tokenPayload),
    };

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
      tokens,
    };
  }

  async getProfile(userId: string): Promise<AuthUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ApiError(404, 'NOT_FOUND', 'User not found');
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
    };
  }

  async updateProfile(
    userId: string,
    data: Partial<{ displayName: string; bio: string; avatarUrl: string }>
  ) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
    });

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
    };
  }
}

export const authService = new AuthService();
