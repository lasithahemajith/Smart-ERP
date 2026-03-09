import { AuthUseCases } from '../core/usecases/auth/AuthUseCases';
import { IUserRepository } from '../core/interfaces/repositories/IUserRepository';
import { UserEntity } from '../core/entities/User';
import { AppError } from '../api/middlewares/errorHandler';
import bcrypt from 'bcryptjs';

const mockUser: UserEntity = {
  id: 'user-1',
  email: 'admin@test.com',
  password: '',
  firstName: 'Admin',
  lastName: 'User',
  role: 'ADMIN',
  status: 'ACTIVE',
  refreshToken: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockUserRepo: jest.Mocked<IUserRepository> = {
  findById: jest.fn(),
  findByEmail: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updateRefreshToken: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
};

describe('AuthUseCases', () => {
  let authUseCases: AuthUseCases;

  beforeEach(() => {
    jest.clearAllMocks();
    authUseCases = new AuthUseCases(
      mockUserRepo,
      'test-secret',
      '1d',
      'refresh-secret',
      '7d',
      1,
    );
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);
      const hashedPassword = await bcrypt.hash('password123', 1);
      mockUserRepo.create.mockResolvedValue({ ...mockUser, password: hashedPassword });

      const result = await authUseCases.register({
        email: 'admin@test.com',
        password: 'password123',
        firstName: 'Admin',
        lastName: 'User',
      });

      expect(result.email).toBe('admin@test.com');
      expect(result).not.toHaveProperty('password');
      expect(mockUserRepo.create).toHaveBeenCalledTimes(1);
    });

    it('should throw 409 if email already exists', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(mockUser);

      await expect(
        authUseCases.register({
          email: 'admin@test.com',
          password: 'password123',
          firstName: 'Admin',
          lastName: 'User',
        }),
      ).rejects.toThrow(AppError);
    });
  });

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 1);
      mockUserRepo.findByEmail.mockResolvedValue({ ...mockUser, password: hashedPassword });
      mockUserRepo.updateRefreshToken.mockResolvedValue(undefined);

      const result = await authUseCases.login('admin@test.com', 'password123');

      expect(result.user.email).toBe('admin@test.com');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw 401 for invalid password', async () => {
      const hashedPassword = await bcrypt.hash('password123', 1);
      mockUserRepo.findByEmail.mockResolvedValue({ ...mockUser, password: hashedPassword });

      await expect(authUseCases.login('admin@test.com', 'wrongpassword')).rejects.toThrow(AppError);
    });

    it('should throw 401 for non-existent user', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);

      await expect(authUseCases.login('nobody@test.com', 'password')).rejects.toThrow(AppError);
    });

    it('should throw 401 for inactive user', async () => {
      const hashedPassword = await bcrypt.hash('password123', 1);
      mockUserRepo.findByEmail.mockResolvedValue({ ...mockUser, password: hashedPassword, status: 'INACTIVE' });

      await expect(authUseCases.login('admin@test.com', 'password123')).rejects.toThrow(AppError);
    });
  });

  describe('logout', () => {
    it('should clear refresh token on logout', async () => {
      mockUserRepo.updateRefreshToken.mockResolvedValue(undefined);
      await authUseCases.logout('user-1');
      expect(mockUserRepo.updateRefreshToken).toHaveBeenCalledWith('user-1', null);
    });
  });
});
