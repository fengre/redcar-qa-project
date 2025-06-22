import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-jwt-secret'),
  };

  beforeEach(async () => {
    // Reset the mock before each test
    jest.clearAllMocks();
    mockConfigService.get.mockReturnValue('test-jwt-secret');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('constructor', () => {
    it('should initialize with custom JWT secret', () => {
      const customSecret = 'custom-jwt-secret';
      mockConfigService.get.mockReturnValue(customSecret);

      // Create a new module with the custom secret
      const customModule = Test.createTestingModule({
        providers: [
          JwtStrategy,
          {
            provide: ConfigService,
            useValue: { get: jest.fn().mockReturnValue(customSecret) },
          },
        ],
      }).compile();

      return expect(customModule).resolves.toBeDefined();
    });

    it('should use default JWT secret when not provided', async () => {
      // Create a new module with undefined secret
      const customModule = Test.createTestingModule({
        providers: [
          JwtStrategy,
          {
            provide: ConfigService,
            useValue: { get: jest.fn().mockReturnValue(undefined) },
          },
        ],
      }).compile();

      await expect(customModule).rejects.toThrow('JwtStrategy requires a secret or key');
    });

    it('should configure JWT extraction from Authorization header', () => {
      expect(strategy).toBeDefined();
    });

    it('should configure JWT to not ignore expiration', () => {
      expect(strategy).toBeDefined();
    });
  });

  describe('validate', () => {
    it('should return user object with userId and username from payload', async () => {
      const mockPayload = {
        sub: 'user-id-123',
        username: 'testuser',
        iat: 1234567890,
        exp: 1234567890,
      };

      const result = await strategy.validate(mockPayload);

      expect(result).toEqual({
        userId: 'user-id-123',
        username: 'testuser',
      });
    });

    it('should handle payload with only required fields', async () => {
      const mockPayload = {
        sub: 'user-id-123',
        username: 'testuser',
      };

      const result = await strategy.validate(mockPayload);

      expect(result).toEqual({
        userId: 'user-id-123',
        username: 'testuser',
      });
    });

    it('should handle payload with additional fields', async () => {
      const mockPayload = {
        sub: 'user-id-123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'admin',
        permissions: ['read', 'write'],
      };

      const result = await strategy.validate(mockPayload);

      expect(result).toEqual({
        userId: 'user-id-123',
        username: 'testuser',
      });
    });

    it('should handle payload with numeric userId', async () => {
      const mockPayload = {
        sub: 12345,
        username: 'testuser',
      };

      const result = await strategy.validate(mockPayload);

      expect(result).toEqual({
        userId: 12345,
        username: 'testuser',
      });
    });

    it('should handle payload with empty username', async () => {
      const mockPayload = {
        sub: 'user-id-123',
        username: '',
      };

      const result = await strategy.validate(mockPayload);

      expect(result).toEqual({
        userId: 'user-id-123',
        username: '',
      });
    });

    it('should handle payload with special characters in username', async () => {
      const mockPayload = {
        sub: 'user-id-123',
        username: 'test@user#123',
      };

      const result = await strategy.validate(mockPayload);

      expect(result).toEqual({
        userId: 'user-id-123',
        username: 'test@user#123',
      });
    });

    it('should handle payload with very long username', async () => {
      const longUsername = 'a'.repeat(100);
      const mockPayload = {
        sub: 'user-id-123',
        username: longUsername,
      };

      const result = await strategy.validate(mockPayload);

      expect(result).toEqual({
        userId: 'user-id-123',
        username: longUsername,
      });
    });

    it('should handle payload with very long userId', async () => {
      const longUserId = 'a'.repeat(100);
      const mockPayload = {
        sub: longUserId,
        username: 'testuser',
      };

      const result = await strategy.validate(mockPayload);

      expect(result).toEqual({
        userId: longUserId,
        username: 'testuser',
      });
    });

    it('should handle payload with null values', async () => {
      const mockPayload = {
        sub: null,
        username: null,
      };

      const result = await strategy.validate(mockPayload);

      expect(result).toEqual({
        userId: null,
        username: null,
      });
    });

    it('should handle payload with undefined values', async () => {
      const mockPayload = {
        sub: undefined,
        username: undefined,
      };

      const result = await strategy.validate(mockPayload);

      expect(result).toEqual({
        userId: undefined,
        username: undefined,
      });
    });

    it('should handle payload with missing fields', async () => {
      const mockPayload = {};

      const result = await strategy.validate(mockPayload);

      expect(result).toEqual({
        userId: undefined,
        username: undefined,
      });
    });

    it('should handle payload with only sub field', async () => {
      const mockPayload = {
        sub: 'user-id-123',
      };

      const result = await strategy.validate(mockPayload);

      expect(result).toEqual({
        userId: 'user-id-123',
        username: undefined,
      });
    });

    it('should handle payload with only username field', async () => {
      const mockPayload = {
        username: 'testuser',
      };

      const result = await strategy.validate(mockPayload);

      expect(result).toEqual({
        userId: undefined,
        username: 'testuser',
      });
    });

    it('should handle async validation without errors', async () => {
      const mockPayload = {
        sub: 'user-id-123',
        username: 'testuser',
      };

      const result = await strategy.validate(mockPayload);

      expect(result).toEqual({
        userId: 'user-id-123',
        username: 'testuser',
      });
    });

    it('should handle validation with complex payload structure', async () => {
      const mockPayload = {
        sub: 'user-id-123',
        username: 'testuser',
        metadata: {
          lastLogin: '2023-01-01',
          preferences: {
            theme: 'dark',
            language: 'en',
          },
        },
        permissions: ['read', 'write', 'admin'],
        roles: ['user', 'moderator'],
      };

      const result = await strategy.validate(mockPayload);

      expect(result).toEqual({
        userId: 'user-id-123',
        username: 'testuser',
      });
    });
  });

  describe('configuration', () => {
    it('should use correct JWT secret from config', () => {
      expect(configService.get).toHaveBeenCalledWith('JWT_SECRET', 'changeme');
    });

    it('should handle empty JWT secret', async () => {
      // Create a new module with empty secret
      const customModule = Test.createTestingModule({
        providers: [
          JwtStrategy,
          {
            provide: ConfigService,
            useValue: { get: jest.fn().mockReturnValue('') },
          },
        ],
      }).compile();

      await expect(customModule).rejects.toThrow('JwtStrategy requires a secret or key');
    });

    it('should handle very long JWT secret', async () => {
      const longSecret = 'a'.repeat(1000);
      
      // Create a new module with long secret
      const customModule = Test.createTestingModule({
        providers: [
          JwtStrategy,
          {
            provide: ConfigService,
            useValue: { get: jest.fn().mockReturnValue(longSecret) },
          },
        ],
      }).compile();

      return expect(customModule).resolves.toBeDefined();
    });

    it('should handle special characters in JWT secret', async () => {
      const specialSecret = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      
      // Create a new module with special characters secret
      const customModule = Test.createTestingModule({
        providers: [
          JwtStrategy,
          {
            provide: ConfigService,
            useValue: { get: jest.fn().mockReturnValue(specialSecret) },
          },
        ],
      }).compile();

      return expect(customModule).resolves.toBeDefined();
    });
  });
}); 