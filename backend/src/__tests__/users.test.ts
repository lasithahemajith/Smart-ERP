import { UserUseCases } from '../core/usecases/users/UserUseCases';
import { IUserRepository } from '../core/interfaces/repositories/IUserRepository';
import { UserEntity } from '../core/entities/User';
import { AppError } from '../api/middlewares/errorHandler';

const mockUser: UserEntity = {
  id: 'user-1',
  email: 'admin@test.com',
  password: 'hashed',
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

describe('UserUseCases', () => {
  let userUseCases: UserUseCases;

  beforeEach(() => {
    jest.clearAllMocks();
    userUseCases = new UserUseCases(mockUserRepo, 1);
  });

  describe('getAllUsers', () => {
    it('should return all users as public entities', async () => {
      mockUserRepo.findAll.mockResolvedValue([mockUser]);
      const users = await userUseCases.getAllUsers();
      expect(users).toHaveLength(1);
      expect(users[0]).not.toHaveProperty('password');
      expect(users[0].email).toBe('admin@test.com');
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser);
      const user = await userUseCases.getUserById('user-1');
      expect(user.id).toBe('user-1');
    });

    it('should throw 404 if user not found', async () => {
      mockUserRepo.findById.mockResolvedValue(null);
      await expect(userUseCases.getUserById('bad-id')).rejects.toThrow(AppError);
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);
      mockUserRepo.create.mockResolvedValue(mockUser);
      const user = await userUseCases.createUser({
        email: 'admin@test.com',
        password: 'password123',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
      });
      expect(user.email).toBe('admin@test.com');
    });

    it('should throw 409 if email exists', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(mockUser);
      await expect(
        userUseCases.createUser({ email: 'admin@test.com', password: 'pass', firstName: 'A', lastName: 'B' }),
      ).rejects.toThrow(AppError);
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      mockUserRepo.findAll.mockResolvedValue([
        { ...mockUser, role: 'ADMIN', status: 'ACTIVE' },
        { ...mockUser, id: 'user-2', role: 'MANAGER', status: 'ACTIVE' },
        { ...mockUser, id: 'user-3', role: 'EMPLOYEE', status: 'INACTIVE' },
      ]);

      const stats = await userUseCases.getUserStats();
      expect(stats.total).toBe(3);
      expect(stats.byRole.ADMIN).toBe(1);
      expect(stats.byRole.MANAGER).toBe(1);
      expect(stats.byRole.EMPLOYEE).toBe(1);
      expect(stats.active).toBe(2);
    });
  });
});
