/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsNotEmpty, IsString, IsEmail } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;
}

// DTO for updating a user
export class UpdateUserDto {
  @IsString()
  name?: string;

  @IsEmail()
  email?: string;
}
