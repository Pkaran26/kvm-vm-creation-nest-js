import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module'; // Import UserModule
import { ConfigModule, ConfigService } from '@nestjs/config'; // For JWT secret
import { JwtAuthGuard } from './guards/jwt.guard'; // Import our custom guard
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/user.entity';
import { UserService } from 'src/user/user.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    UserModule, // AuthService needs UsersService
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '60m' }, // Token expiration time
      }),
      inject: [ConfigService],
    }),
    ConfigModule, // Import ConfigModule as JwtAuthGuard needs ConfigService
  ],
  providers: [AuthService, JwtAuthGuard, UserService], // Register AuthService and our custom Guard
  controllers: [AuthController],
  exports: [AuthService, JwtAuthGuard], // Export Guard so it can be used in other modules
})
export class AuthModule {}
