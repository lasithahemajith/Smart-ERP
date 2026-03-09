import { UserEntity, UserRole, UserStatus } from '../../entities/User';

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findAll(filter?: { role?: UserRole; status?: UserStatus }): Promise<UserEntity[]>;
  create(data: CreateUserDto): Promise<UserEntity>;
  update(id: string, data: UpdateUserDto): Promise<UserEntity>;
  updateRefreshToken(id: string, token: string | null): Promise<void>;
  delete(id: string): Promise<void>;
  count(): Promise<number>;
}
