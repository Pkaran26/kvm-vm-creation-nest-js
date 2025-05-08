/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

@Entity()
export class DiskPack {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsNotEmpty()
  @IsString()
  name: string;

  @Column()
  @IsNotEmpty()
  @IsNumber()
  diskSize: number;

  @Column()
  @IsNotEmpty()
  @IsNumber()
  monthlyPrice: number;

  @Column()
  @IsNotEmpty()
  @IsNumber()
  hourlyPrice: number;
}
