import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { User } from './user.entity';
import { RegisterDto, LoginDto } from './auth.dto';

// Mock bcrypt
jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      username: 'testuser',
      password: 'password123',
    };

    const mockUser: User = {
      id: 'user-id-1',
      username: 'testuser',
      password: 'hashedpassword',
      createdAt: new Date(),
    };

    const mockAuthResponse = {
      accessToken: 'jwt-token',
      user: {
        id: mockUser.id,
        username: mockUser.username,
        createdAt: mockUser.createdAt,
      },
    };

    it('should successfully register a new user', async () => {
      // Mock bcrypt hash
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
      
      // Mock repository methods
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);
      
      // Mock JWT sign
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.register(registerDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { username: 'testuser' } });
      expect(mockRepository.create).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'hashedpassword',
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockUser);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        username: mockUser.username,
      });
      expect(result).toEqual(mockAuthResponse);
    });

    it('should throw ConflictException when username already exists', async () => {
      const existingUser = { ...mockUser };
      mockRepository.findOne.mockResolvedValue(existingUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      await expect(service.register(registerDto)).rejects.toThrow('Username already taken');

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { username: 'testuser' } });
      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should handle bcrypt hashing errors', async () => {
      const hashError = new Error('Hashing failed');
      (bcrypt.hash as jest.Mock).mockRejectedValue(hashError);
      
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.register(registerDto)).rejects.toThrow('Hashing failed');

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { username: 'testuser' } });
      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should handle repository save errors', async () => {
      const saveError = new Error('Database save failed');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
      
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockRejectedValue(saveError);

      await expect(service.register(registerDto)).rejects.toThrow('Database save failed');

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { username: 'testuser' } });
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalledWith(mockUser);
    });

    it('should handle JWT signing errors', async () => {
      const jwtError = new Error('JWT signing failed');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
      
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);
      mockJwtService.sign.mockImplementation(() => {
        throw jwtError;
      });

      await expect(service.register(registerDto)).rejects.toThrow('JWT signing failed');

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { username: 'testuser' } });
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalledWith(mockUser);
      expect(jwtService.sign).toHaveBeenCalled();
    });

    it('should handle empty username', async () => {
      const emptyUsernameDto: RegisterDto = {
        username: '',
        password: 'password123',
      };

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.register(emptyUsernameDto)).rejects.toThrow();

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { username: '' } });
    });

    it('should handle special characters in username', async () => {
      const specialUsernameDto: RegisterDto = {
        username: 'test@user#123',
        password: 'password123',
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue({ ...mockUser, username: 'test@user#123' });
      mockRepository.save.mockResolvedValue({ ...mockUser, username: 'test@user#123' });
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.register(specialUsernameDto);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { username: 'test@user#123' } });
      expect(result.user.username).toBe('test@user#123');
    });

    it('should handle very long passwords', async () => {
      const longPassword = 'a'.repeat(1000);
      const longPasswordDto: RegisterDto = {
        username: 'testuser',
        password: longPassword,
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.register(longPasswordDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(longPassword, 10);
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      username: 'testuser',
      password: 'password123',
    };

    const mockUser: User = {
      id: 'user-id-1',
      username: 'testuser',
      password: 'hashedpassword',
      createdAt: new Date(),
    };

    const mockAuthResponse = {
      accessToken: 'jwt-token',
      user: {
        id: mockUser.id,
        username: mockUser.username,
        createdAt: mockUser.createdAt,
      },
    };

    it('should successfully login with correct credentials', async () => {
      // Mock bcrypt compare
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      
      // Mock repository methods
      mockRepository.findOne.mockResolvedValue(mockUser);
      
      // Mock JWT sign
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login(loginDto);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { username: 'testuser' } });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        username: mockUser.username,
      });
      expect(result).toEqual(mockAuthResponse);
    });

    it('should throw UnauthorizedException for unregistered username', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Unregistered username');

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { username: 'testuser' } });
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      // Mock bcrypt compare to return false
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      
      mockRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Wrong password');

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { username: 'testuser' } });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should handle case-sensitive username lookup', async () => {
      const upperCaseDto: LoginDto = {
        username: 'TESTUSER',
        password: 'password123',
      };

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.login(upperCaseDto)).rejects.toThrow('Unregistered username');

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { username: 'TESTUSER' } });
    });

    it('should handle bcrypt compare errors', async () => {
      const compareError = new Error('Password comparison failed');
      (bcrypt.compare as jest.Mock).mockRejectedValue(compareError);
      
      mockRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.login(loginDto)).rejects.toThrow('Password comparison failed');

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { username: 'testuser' } });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
    });

    it('should handle JWT signing errors during login', async () => {
      const jwtError = new Error('JWT signing failed');
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      
      mockRepository.findOne.mockResolvedValue(mockUser);
      mockJwtService.sign.mockImplementation(() => {
        throw jwtError;
      });

      await expect(service.login(loginDto)).rejects.toThrow('JWT signing failed');

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { username: 'testuser' } });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
      expect(jwtService.sign).toHaveBeenCalled();
    });

    it('should handle empty username', async () => {
      const emptyUsernameDto: LoginDto = {
        username: '',
        password: 'password123',
      };

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.login(emptyUsernameDto)).rejects.toThrow('Unregistered username');

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { username: '' } });
    });

    it('should handle empty password', async () => {
      const emptyPasswordDto: LoginDto = {
        username: 'testuser',
        password: '',
      };

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      mockRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.login(emptyPasswordDto)).rejects.toThrow('Wrong password');

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { username: 'testuser' } });
      expect(bcrypt.compare).toHaveBeenCalledWith('', 'hashedpassword');
    });

    it('should handle special characters in password', async () => {
      const specialPasswordDto: LoginDto = {
        username: 'testuser',
        password: 'p@ssw0rd#123!',
      };

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockRepository.findOne.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login(specialPasswordDto);

      expect(bcrypt.compare).toHaveBeenCalledWith('p@ssw0rd#123!', 'hashedpassword');
      expect(result).toEqual(mockAuthResponse);
    });

    it('should handle very long passwords during login', async () => {
      const longPassword = 'a'.repeat(1000);
      const longPasswordDto: LoginDto = {
        username: 'testuser',
        password: longPassword,
      };

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockRepository.findOne.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login(longPasswordDto);

      expect(bcrypt.compare).toHaveBeenCalledWith(longPassword, 'hashedpassword');
      expect(result).toEqual(mockAuthResponse);
    });
  });
}); 