import { AuthService } from '../../services/auth.service';
import { prisma } from '@commerce/database';
import { ApiError } from '../../middleware/error.middleware';

// Mock dependencies
jest.mock('@commerce/database');
jest.mock('../../utils/password.utils');
jest.mock('../../utils/jwt.utils');

import * as passwordUtils from '../../utils/password.utils';
import * as jwtUtils from '../../utils/jwt.utils';

describe('AuthService Unit Tests', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('signup', () => {
    const signupData = {
      email: 'test@example.com',
      password: 'password123',
      username: 'testuser',
      displayName: 'Test User',
    };

    it('should create user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: signupData.email,
        username: signupData.username,
        displayName: signupData.displayName,
        passwordHash: 'hashed',
        avatarUrl: null,
        bio: null,
        emailVerified: false,
        stripeAccountId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
      (passwordUtils.hashPassword as jest.Mock).mockResolvedValue('hashed');
      (jwtUtils.generateAccessToken as jest.Mock).mockReturnValue('access-token');
      (jwtUtils.generateRefreshToken as jest.Mock).mockReturnValue('refresh-token');

      const result = await authService.signup(signupData);

      expect(result.user.email).toBe(signupData.email);
      expect(result.tokens.accessToken).toBe('access-token');
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: signupData.email,
          username: signupData.username,
        }),
      });
    });

    it('should throw error if email exists', async () => {
      const existingUser = { id: '123', email: signupData.email };
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(existingUser);

      await expect(authService.signup(signupData)).rejects.toThrow(ApiError);
      await expect(authService.signup(signupData)).rejects.toThrow('Email already in use');
    });

    it('should throw error if username exists', async () => {
      const existingUser = { id: '123', username: signupData.username };
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(existingUser);

      await expect(authService.signup(signupData)).rejects.toThrow(ApiError);
      await expect(authService.signup(signupData)).rejects.toThrow('Username already taken');
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        avatarUrl: null,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await authService.getProfile('user-123');

      expect(result.email).toBe(mockUser.email);
      expect(result.id).toBe(mockUser.id);
    });

    it('should throw error if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(authService.getProfile('nonexistent')).rejects.toThrow(ApiError);
      await expect(authService.getProfile('nonexistent')).rejects.toThrow('User not found');
    });
  });
});
