import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';
import { RegisterDto, LoginDto, AuthResponseDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { username, password } = registerDto;
    const existing = await this.userRepository.findOne({ where: { username } });
    if (existing) {
      throw new ConflictException('Username already taken');
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({ username, password: hashed });
    await this.userRepository.save(user);
    const accessToken = this.jwtService.sign({ sub: user.id, username: user.username });
    return { 
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt
      }
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { username, password } = loginDto;
    
    // First check if user exists
    const user = await this.userRepository.findOne({ where: { username } });
    if (!user) {
      throw new UnauthorizedException('Unregistered username');
    }
    
    // Then check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Wrong password');
    }
    
    const accessToken = this.jwtService.sign({ sub: user.id, username: user.username });
    return { 
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt
      }
    };
  }
} 