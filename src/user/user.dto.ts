import { IsNotEmpty, IsString, IsEmail } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  fname: string;

  @IsNotEmpty()
  @IsString()
  lname: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}

// DTO for updating a user
export class UpdateUserDto {
  @IsString()
  name?: string;

  @IsEmail()
  email?: string;
}

export interface UserInterface {
  userId: number; // Or string, ObjectId
  username: string;
  password?: string; // Password might not be returned on all queries
}
