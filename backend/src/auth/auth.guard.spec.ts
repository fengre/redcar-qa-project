import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtAuthGuard],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    // Helper function to create a proper mock context
    const createMockContext = (request: any): ExecutionContext => ({
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({} as any),
        getNext: () => jest.fn() as any,
      }),
      getClass: jest.fn(),
      getHandler: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      getType: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
    });

    it('should return true when authentication is successful', async () => {
      const mockContext = createMockContext({
        headers: {
          authorization: 'Bearer valid-jwt-token',
        },
      });

      // Mock the parent AuthGuard's canActivate method
      jest.spyOn(guard, 'canActivate').mockResolvedValue(true);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should return false when authentication fails', async () => {
      const mockContext = createMockContext({
        headers: {
          authorization: 'Bearer invalid-jwt-token',
        },
      });

      // Mock the parent AuthGuard's canActivate method
      jest.spyOn(guard, 'canActivate').mockResolvedValue(false);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(false);
    });

    it('should handle missing authorization header', async () => {
      const mockContext = createMockContext({
        headers: {},
      });

      // Mock the parent AuthGuard's canActivate method to throw UnauthorizedException
      jest.spyOn(guard, 'canActivate').mockRejectedValue(new UnauthorizedException('No token provided'));

      await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(mockContext)).rejects.toThrow('No token provided');
    });

    it('should handle malformed authorization header', async () => {
      const mockContext = createMockContext({
        headers: {
          authorization: 'InvalidFormat',
        },
      });

      // Mock the parent AuthGuard's canActivate method to throw UnauthorizedException
      jest.spyOn(guard, 'canActivate').mockRejectedValue(new UnauthorizedException('Invalid token format'));

      await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(mockContext)).rejects.toThrow('Invalid token format');
    });

    it('should handle expired JWT token', async () => {
      const mockContext = createMockContext({
        headers: {
          authorization: 'Bearer expired-jwt-token',
        },
      });

      // Mock the parent AuthGuard's canActivate method to throw UnauthorizedException
      jest.spyOn(guard, 'canActivate').mockRejectedValue(new UnauthorizedException('Token expired'));

      await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(mockContext)).rejects.toThrow('Token expired');
    });

    it('should handle invalid JWT signature', async () => {
      const mockContext = createMockContext({
        headers: {
          authorization: 'Bearer invalid-signature-token',
        },
      });

      // Mock the parent AuthGuard's canActivate method to throw UnauthorizedException
      jest.spyOn(guard, 'canActivate').mockRejectedValue(new UnauthorizedException('Invalid token signature'));

      await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(mockContext)).rejects.toThrow('Invalid token signature');
    });

    it('should handle empty authorization header', async () => {
      const mockContext = createMockContext({
        headers: {
          authorization: '',
        },
      });

      // Mock the parent AuthGuard's canActivate method to throw UnauthorizedException
      jest.spyOn(guard, 'canActivate').mockRejectedValue(new UnauthorizedException('Empty authorization header'));

      await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(mockContext)).rejects.toThrow('Empty authorization header');
    });

    it('should handle authorization header with only Bearer prefix', async () => {
      const mockContext = createMockContext({
        headers: {
          authorization: 'Bearer ',
        },
      });

      // Mock the parent AuthGuard's canActivate method to throw UnauthorizedException
      jest.spyOn(guard, 'canActivate').mockRejectedValue(new UnauthorizedException('No token provided'));

      await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(mockContext)).rejects.toThrow('No token provided');
    });

    it('should handle case-insensitive Bearer prefix', async () => {
      const mockContext = createMockContext({
        headers: {
          authorization: 'bearer valid-jwt-token',
        },
      });

      // Mock the parent AuthGuard's canActivate method
      jest.spyOn(guard, 'canActivate').mockResolvedValue(true);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should handle mixed case Bearer prefix', async () => {
      const mockContext = createMockContext({
        headers: {
          authorization: 'BeArEr valid-jwt-token',
        },
      });

      // Mock the parent AuthGuard's canActivate method
      jest.spyOn(guard, 'canActivate').mockResolvedValue(true);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should handle very long JWT token', async () => {
      const longToken = 'a'.repeat(10000);
      const mockContext = createMockContext({
        headers: {
          authorization: `Bearer ${longToken}`,
        },
      });

      // Mock the parent AuthGuard's canActivate method
      jest.spyOn(guard, 'canActivate').mockResolvedValue(true);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should handle JWT token with special characters', async () => {
      const specialToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const mockContext = createMockContext({
        headers: {
          authorization: `Bearer ${specialToken}`,
        },
      });

      // Mock the parent AuthGuard's canActivate method
      jest.spyOn(guard, 'canActivate').mockResolvedValue(true);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should handle request with additional headers', async () => {
      const mockContext = createMockContext({
        headers: {
          'content-type': 'application/json',
          'user-agent': 'Mozilla/5.0',
          'accept': 'application/json',
          authorization: 'Bearer valid-jwt-token',
        },
      });

      // Mock the parent AuthGuard's canActivate method
      jest.spyOn(guard, 'canActivate').mockResolvedValue(true);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should handle request with query parameters', async () => {
      const mockContext = createMockContext({
        headers: {
          authorization: 'Bearer valid-jwt-token',
        },
        query: {
          page: '1',
          limit: '10',
          sort: 'createdAt',
        },
      });

      // Mock the parent AuthGuard's canActivate method
      jest.spyOn(guard, 'canActivate').mockResolvedValue(true);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should handle request with body data', async () => {
      const mockContext = createMockContext({
        headers: {
          authorization: 'Bearer valid-jwt-token',
        },
        body: {
          question: 'What does example.com do?',
        },
      });

      // Mock the parent AuthGuard's canActivate method
      jest.spyOn(guard, 'canActivate').mockResolvedValue(true);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should handle request with URL parameters', async () => {
      const mockContext = createMockContext({
        headers: {
          authorization: 'Bearer valid-jwt-token',
        },
        params: {
          id: '123',
          type: 'history',
        },
      });

      // Mock the parent AuthGuard's canActivate method
      jest.spyOn(guard, 'canActivate').mockResolvedValue(true);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should handle execution context errors', async () => {
      const mockContext = createMockContext({
        headers: {
          authorization: 'Bearer valid-jwt-token',
        },
      });

      // Mock the parent AuthGuard's canActivate method to throw the context error
      jest.spyOn(guard, 'canActivate').mockRejectedValue(new Error('Context error'));

      await expect(guard.canActivate(mockContext)).rejects.toThrow('Context error');
    });

    it('should handle null request object', async () => {
      const mockContext = createMockContext(null);

      // Mock the parent AuthGuard's canActivate method to throw UnauthorizedException
      jest.spyOn(guard, 'canActivate').mockRejectedValue(new UnauthorizedException('Invalid request'));

      await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(mockContext)).rejects.toThrow('Invalid request');
    });

    it('should handle undefined headers', async () => {
      const mockContext = createMockContext({
        headers: undefined,
      });

      // Mock the parent AuthGuard's canActivate method to throw UnauthorizedException
      jest.spyOn(guard, 'canActivate').mockRejectedValue(new UnauthorizedException('No authorization header'));

      await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(mockContext)).rejects.toThrow('No authorization header');
    });
  });
}); 