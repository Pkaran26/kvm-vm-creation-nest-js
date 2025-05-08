/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class CreateCPUDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  cpu: number;

  @IsNotEmpty()
  @IsNumber()
  ram: number;

  @IsNotEmpty()
  @IsNumber()
  monthlyPrice: number;

  @IsNotEmpty()
  @IsNumber()
  hourlyPrice: number;
}

export class UpdateCPUDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  cpu: number;

  @IsNotEmpty()
  @IsNumber()
  ram: number;

  @IsNotEmpty()
  @IsNumber()
  monthlyPrice: number;

  @IsNotEmpty()
  @IsNumber()
  hourlyPrice: number;
}
