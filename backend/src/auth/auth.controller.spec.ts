import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, AuthResponseDto } from './auth.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      username: 'testuser',
      password: 'password123',
    };

    const mockAuthResponse: AuthResponseDto = {
      accessToken: 'jwt-token',
      user: {
        id: 'user-id-1',
        username: 'testuser',
        createdAt: new Date(),
      },
    };

    it('should successfully register a new user', async () => {
      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockAuthResponse);
    });

    it('should handle username already taken error', async () => {
      const error = new Error('Username already taken');
      mockAuthService.register.mockRejectedValue(error);

      await expect(controller.register(registerDto)).rejects.toThrow('Username already taken');

      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });

    it('should handle validation errors', async () => {
      const validationError = new Error('Validation failed');
      mockAuthService.register.mockRejectedValue(validationError);

      await expect(controller.register(registerDto)).rejects.toThrow('Validation failed');

      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });

    it('should handle empty username', async () => {
      const emptyUsernameDto: RegisterDto = {
        username: '',
        password: 'password123',
      };

      const error = new Error('Username cannot be empty');
      mockAuthService.register.mockRejectedValue(error);

      await expect(controller.register(emptyUsernameDto)).rejects.toThrow('Username cannot be empty');

      expect(authService.register).toHaveBeenCalledWith(emptyUsernameDto);
    });

    it('should handle short password', async () => {
      const shortPasswordDto: RegisterDto = {
        username: 'testuser',
        password: '123',
      };

      const error = new Error('Password must be longer than or equal to 6 characters');
      mockAuthService.register.mockRejectedValue(error);

      await expect(controller.register(shortPasswordDto)).rejects.toThrow('Password must be longer than or equal to 6 characters');

      expect(authService.register).toHaveBeenCalledWith(shortPasswordDto);
    });

    it('should handle special characters in username', async () => {
      const specialUsernameDto: RegisterDto = {
        username: 'test@user#123',
        password: 'password123',
      };

      mockAuthService.register.mockResolvedValue({
        ...mockAuthResponse,
        user: { ...mockAuthResponse.user, username: 'test@user#123' },
      });

      const result = await controller.register(specialUsernameDto);

      expect(authService.register).toHaveBeenCalledWith(specialUsernameDto);
      expect(result.user.username).toBe('test@user#123');
    });

    it('should handle very long username', async () => {
      const longUsername = 'a'.repeat(100);
      const longUsernameDto: RegisterDto = {
        username: longUsername,
        password: 'password123',
      };

      mockAuthService.register.mockResolvedValue({
        ...mockAuthResponse,
        user: { ...mockAuthResponse.user, username: longUsername },
      });

      const result = await controller.register(longUsernameDto);

      expect(authService.register).toHaveBeenCalledWith(longUsernameDto);
      expect(result.user.username).toBe(longUsername);
    });

    it('should handle very long password', async () => {
      const longPassword = 'a'.repeat(1000);
      const longPasswordDto: RegisterDto = {
        username: 'testuser',
        password: longPassword,
      };

      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register(longPasswordDto);

      expect(authService.register).toHaveBeenCalledWith(longPasswordDto);
      expect(result).toEqual(mockAuthResponse);
    });

    it('should handle database connection errors', async () => {
      const dbError = new Error('Database connection failed');
      mockAuthService.register.mockRejectedValue(dbError);

      await expect(controller.register(registerDto)).rejects.toThrow('Database connection failed');

      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });

    it('should handle JWT token generation errors', async () => {
      const jwtError = new Error('JWT token generation failed');
      mockAuthService.register.mockRejectedValue(jwtError);

      await expect(controller.register(registerDto)).rejects.toThrow('JWT token generation failed');

      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      username: 'testuser',
      password: 'password123',
    };

    const mockAuthResponse: AuthResponseDto = {
      accessToken: 'jwt-token',
      user: {
        id: 'user-id-1',
        username: 'testuser',
        createdAt: new Date(),
      },
    };

    it('should successfully login with correct credentials', async () => {
      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(mockAuthResponse);
    });

    it('should handle unregistered username error', async () => {
      const error = new Error('Unregistered username');
      mockAuthService.login.mockRejectedValue(error);

      await expect(controller.login(loginDto)).rejects.toThrow('Unregistered username');

      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });

    it('should handle wrong password error', async () => {
      const error = new Error('Wrong password');
      mockAuthService.login.mockRejectedValue(error);

      await expect(controller.login(loginDto)).rejects.toThrow('Wrong password');

      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });

    it('should handle empty username', async () => {
      const emptyUsernameDto: LoginDto = {
        username: '',
        password: 'password123',
      };

      const error = new Error('Unregistered username');
      mockAuthService.login.mockRejectedValue(error);

      await expect(controller.login(emptyUsernameDto)).rejects.toThrow('Unregistered username');

      expect(authService.login).toHaveBeenCalledWith(emptyUsernameDto);
    });

    it('should handle empty password', async () => {
      const emptyPasswordDto: LoginDto = {
        username: 'testuser',
        password: '',
      };

      const error = new Error('Wrong password');
      mockAuthService.login.mockRejectedValue(error);

      await expect(controller.login(emptyPasswordDto)).rejects.toThrow('Wrong password');

      expect(authService.login).toHaveBeenCalledWith(emptyPasswordDto);
    });

    it('should handle case-sensitive username', async () => {
      const upperCaseDto: LoginDto = {
        username: 'TESTUSER',
        password: 'password123',
      };

      const error = new Error('Unregistered username');
      mockAuthService.login.mockRejectedValue(error);

      await expect(controller.login(upperCaseDto)).rejects.toThrow('Unregistered username');

      expect(authService.login).toHaveBeenCalledWith(upperCaseDto);
    });

    it('should handle special characters in username', async () => {
      const specialUsernameDto: LoginDto = {
        username: 'test@user#123',
        password: 'password123',
      };

      mockAuthService.login.mockResolvedValue({
        ...mockAuthResponse,
        user: { ...mockAuthResponse.user, username: 'test@user#123' },
      });

      const result = await controller.login(specialUsernameDto);

      expect(authService.login).toHaveBeenCalledWith(specialUsernameDto);
      expect(result.user.username).toBe('test@user#123');
    });

    it('should handle special characters in password', async () => {
      const specialPasswordDto: LoginDto = {
        username: 'testuser',
        password: 'p@ssw0rd#123!',
      };

      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(specialPasswordDto);

      expect(authService.login).toHaveBeenCalledWith(specialPasswordDto);
      expect(result).toEqual(mockAuthResponse);
    });

    it('should handle very long username', async () => {
      const longUsername = 'a'.repeat(100);
      const longUsernameDto: LoginDto = {
        username: longUsername,
        password: 'password123',
      };

      const error = new Error('Unregistered username');
      mockAuthService.login.mockRejectedValue(error);

      await expect(controller.login(longUsernameDto)).rejects.toThrow('Unregistered username');

      expect(authService.login).toHaveBeenCalledWith(longUsernameDto);
    });

    it('should handle very long password', async () => {
      const longPassword = 'a'.repeat(1000);
      const longPasswordDto: LoginDto = {
        username: 'testuser',
        password: longPassword,
      };

      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(longPasswordDto);

      expect(authService.login).toHaveBeenCalledWith(longPasswordDto);
      expect(result).toEqual(mockAuthResponse);
    });

    it('should handle database connection errors', async () => {
      const dbError = new Error('Database connection failed');
      mockAuthService.login.mockRejectedValue(dbError);

      await expect(controller.login(loginDto)).rejects.toThrow('Database connection failed');

      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });

    it('should handle JWT token generation errors', async () => {
      const jwtError = new Error('JWT token generation failed');
      mockAuthService.login.mockRejectedValue(jwtError);

      await expect(controller.login(loginDto)).rejects.toThrow('JWT token generation failed');

      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });

    it('should handle password hashing errors', async () => {
      const hashError = new Error('Password hashing failed');
      mockAuthService.login.mockRejectedValue(hashError);

      await expect(controller.login(loginDto)).rejects.toThrow('Password hashing failed');

      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });
  });
}); 