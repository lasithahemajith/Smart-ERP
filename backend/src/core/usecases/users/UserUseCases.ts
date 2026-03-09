import { IUserRepository, CreateUserDto, UpdateUserDto } from '../../interfaces/repositories/IUserRepository';
import { UserPublic, UserRole, UserStatus } from '../../entities/User';
import { AppError } from '../../../api/middlewares/errorHandler';
import bcrypt from 'bcryptjs';

export class UserUseCases {
  constructor(
    private userRepo: IUserRepository,
    private bcryptRounds: number,
  ) {}

  async getAllUsers(filter?: { role?: UserRole; status?: UserStatus }): Promise<UserPublic[]> {
    const users = await this.userRepo.findAll(filter);
    return users.map(this.toPublic);
  }

  async getUserById(id: string): Promise<UserPublic> {
    const user = await this.userRepo.findById(id);
    if (!user) throw new AppError('User not found', 404);
    return this.toPublic(user);
  }

  async createUser(data: CreateUserDto): Promise<UserPublic> {
    const existing = await this.userRepo.findByEmail(data.email);
    if (existing) throw new AppError('Email already registered', 409);
    const hashed = await bcrypt.hash(data.password, this.bcryptRounds);
    const user = await this.userRepo.create({ ...data, password: hashed });
    return this.toPublic(user);
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<UserPublic> {
    const existing = await this.userRepo.findById(id);
    if (!existing) throw new AppError('User not found', 404);
    if (data.email && data.email !== existing.email) {
      const conflict = await this.userRepo.findByEmail(data.email);
      if (conflict) throw new AppError('Email already in use', 409);
    }
    const user = await this.userRepo.update(id, data);
    return this.toPublic(user);
  }

  async deleteUser(id: string): Promise<void> {
    const existing = await this.userRepo.findById(id);
    if (!existing) throw new AppError('User not found', 404);
    await this.userRepo.delete(id);
  }

  async getUserStats(): Promise<{ total: number; byRole: Record<UserRole, number>; active: number }> {
    const users = await this.userRepo.findAll();
    const byRole = { ADMIN: 0, MANAGER: 0, EMPLOYEE: 0 } as Record<UserRole, number>;
    let active = 0;
    for (const u of users) {
      byRole[u.role as UserRole]++;
      if (u.status === 'ACTIVE') active++;
    }
    return { total: users.length, byRole, active };
  }

  private toPublic(user: { id: string; email: string; firstName: string; lastName: string; role: UserRole; status: UserStatus; createdAt: Date }): UserPublic {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
    };
  }
}
