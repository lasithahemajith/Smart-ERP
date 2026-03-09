import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IUserRepository } from '../../interfaces/repositories/IUserRepository';
import { UserPublic } from '../../entities/User';
import { AppError } from '../../../api/middlewares/errorHandler';

interface LoginResult {
  user: UserPublic;
  accessToken: string;
  refreshToken: string;
}

export class AuthUseCases {
  constructor(
    private userRepo: IUserRepository,
    private jwtSecret: string,
    private jwtExpiresIn: string,
    private refreshSecret: string,
    private refreshExpiresIn: string,
    private bcryptRounds: number,
  ) {}

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  }): Promise<UserPublic> {
    const existing = await this.userRepo.findByEmail(data.email);
    if (existing) {
      throw new AppError('Email already registered', 409);
    }
    const hashed = await bcrypt.hash(data.password, this.bcryptRounds);
    const user = await this.userRepo.create({ ...data, password: hashed });
    return this.toPublic(user);
  }

  async login(email: string, password: string): Promise<LoginResult> {
    const user = await this.userRepo.findByEmail(email);
    if (!user || user.status !== 'ACTIVE') {
      throw new AppError('Invalid credentials', 401);
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new AppError('Invalid credentials', 401);
    }

    const accessToken = this.generateAccessToken(user.id, user.role);
    const refreshToken = this.generateRefreshToken(user.id);
    await this.userRepo.updateRefreshToken(user.id, refreshToken);

    return { user: this.toPublic(user), accessToken, refreshToken };
  }

  async refresh(token: string): Promise<{ accessToken: string }> {
    let payload: { sub: string };
    try {
      payload = jwt.verify(token, this.refreshSecret) as { sub: string };
    } catch {
      throw new AppError('Invalid refresh token', 401);
    }

    const user = await this.userRepo.findById(payload.sub);
    if (!user || user.refreshToken !== token) {
      throw new AppError('Invalid refresh token', 401);
    }

    const accessToken = this.generateAccessToken(user.id, user.role);
    return { accessToken };
  }

  async logout(userId: string): Promise<void> {
    await this.userRepo.updateRefreshToken(userId, null);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new AppError('Current password is incorrect', 400);
    const hashed = await bcrypt.hash(newPassword, this.bcryptRounds);
    await this.userRepo.update(userId, { ...(user as object), password: hashed } as never);
  }

  private generateAccessToken(userId: string, role: string): string {
    return jwt.sign({ sub: userId, role }, this.jwtSecret, { expiresIn: this.jwtExpiresIn } as jwt.SignOptions);
  }

  private generateRefreshToken(userId: string): string {
    return jwt.sign({ sub: userId }, this.refreshSecret, { expiresIn: this.refreshExpiresIn } as jwt.SignOptions);
  }

  private toPublic(user: { id: string; email: string; firstName: string; lastName: string; role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE'; status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'; createdAt: Date }): UserPublic {
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
