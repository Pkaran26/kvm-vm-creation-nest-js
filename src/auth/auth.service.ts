import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../user/user.entity'; // Assuming User entity structure
import { Login } from './auth.interface';
import { CreateUserDto } from 'src/user/user.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService, // Inject UsersService
    private jwtService: JwtService, // Inject JwtService
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.userService.findOne(username);
    if (!user || !user.password) {
      return null; // User not found or password not available
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const isMatch = (await bcrypt.compare(pass, user.password)) as boolean;
    if (!isMatch) {
      return null; // Passwords don't match
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user; // Omit password from the returned object
    return result; // Return user details (without password)
  }

  async login(user: Login) {
    const userObj = (await this.validateUser(
      user.username,
      user.password,
    )) as User;
    return {
      access_token: this.jwtService.sign(userObj), // Sign the payload to generate the token
    };
  }

  // Signup logic (might live here or directly in controller)
  async signup(payload: CreateUserDto): Promise<User> {
    const user = await this.userService.createUser(payload);
    if (!user) {
      throw new UnauthorizedException('User already exists or creation failed'); // Or use ConflictException
    }
    return user;
  }
}
