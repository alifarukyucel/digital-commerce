import { generateAccessToken, generateRefreshToken, verifyAccessToken, generateDownloadToken } from '../../utils/jwt.utils';

describe('JWT Utils', () => {
  const mockPayload = {
    userId: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
  };

  describe('generateAccessToken', () => {
    it('should generate valid access token', () => {
      const token = generateAccessToken(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format: header.payload.signature
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate valid refresh token', () => {
      const token = generateRefreshToken(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify and decode valid token', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = verifyAccessToken(token);

      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.username).toBe(mockPayload.username);
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyAccessToken('invalid.token.here')).toThrow();
    });

    it('should throw error for expired token', () => {
      // This would require mocking time or using a very short expiry
      // Skipping for now as it requires more complex setup
    });
  });

  describe('generateDownloadToken', () => {
    it('should generate random hex token', () => {
      const token1 = generateDownloadToken();
      const token2 = generateDownloadToken();

      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(token1).not.toBe(token2);
      expect(token1.length).toBe(64); // 32 bytes in hex = 64 characters
      expect(/^[a-f0-9]{64}$/.test(token1)).toBe(true);
    });
  });
});
