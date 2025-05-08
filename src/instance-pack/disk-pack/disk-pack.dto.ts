/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class CreateDiskDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  diskSize: number;

  @IsNotEmpty()
  @IsNumber()
  monthlyPrice: number;

  @IsNotEmpty()
  @IsNumber()
  hourlyPrice: number;
}

export class UpdateUserDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  diskSize: number;

  @IsNotEmpty()
  @IsNumber()
  monthlyPrice: number;

  @IsNotEmpty()
  @IsNumber()
  hourlyPrice: number;
}
