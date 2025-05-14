import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findOne(username: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: {
        username: username,
      },
    });
  }

  async createUser(payload: CreateUserDto): Promise<User> {
    const existingUser = await this.findOne(payload.username);
    if (existingUser) {
      console.log(`User ${payload.username} already exists`);
      return existingUser;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const hashedPassword = (await bcrypt.hash(payload.password, 10)) as string;
    const user = this.userRepository.create({
      ...payload,
      password: hashedPassword,
    });
    return this.userRepository.save(user);
  }

  // Get all users
  async getAllUsers(): Promise<User[]> {
    return this.userRepository.find();
  }

  // Get a single user by ID
  async getUserById(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  //Get user by email.
  async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  // Update an existing user
  async updateUser(id: number, userData: Partial<User>): Promise<User | null> {
    await this.userRepository.update(id, userData);
    return this.getUserById(id);
  }

  // Delete a user by ID
  async deleteUser(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }
}
