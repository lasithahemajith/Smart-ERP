import { PrismaClient } from '@prisma/client';
import { IUserRepository, CreateUserDto, UpdateUserDto } from '../../core/interfaces/repositories/IUserRepository';
import { UserEntity, UserRole, UserStatus } from '../../core/entities/User';

export class UserRepository implements IUserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? this.toEntity(user) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return user ? this.toEntity(user) : null;
  }

  async findAll(filter?: { role?: UserRole; status?: UserStatus }): Promise<UserEntity[]> {
    const users = await this.prisma.user.findMany({
      where: {
        ...(filter?.role ? { role: filter.role } : {}),
        ...(filter?.status ? { status: filter.status } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return users.map(this.toEntity);
  }

  async create(data: CreateUserDto): Promise<UserEntity> {
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role ?? 'EMPLOYEE',
        status: data.status ?? 'ACTIVE',
      },
    });
    return this.toEntity(user);
  }

  async update(id: string, data: UpdateUserDto): Promise<UserEntity> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
        ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
        ...(data.role !== undefined ? { role: data.role } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
      },
    });
    return this.toEntity(user);
  }

  async updateRefreshToken(id: string, token: string | null): Promise<void> {
    await this.prisma.user.update({ where: { id }, data: { refreshToken: token } });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }

  async count(): Promise<number> {
    return this.prisma.user.count();
  }

  private toEntity(user: {
    id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    status: string;
    refreshToken: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): UserEntity {
    return {
      id: user.id,
      email: user.email,
      password: user.password,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as UserRole,
      status: user.status as UserStatus,
      refreshToken: user.refreshToken,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
