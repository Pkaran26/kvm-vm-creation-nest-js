/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

@Entity()
export class CPUPack {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsNotEmpty()
  @IsString()
  name: string;

  @Column()
  @IsNotEmpty()
  @IsNumber()
  cpu: number;

  @Column()
  @IsNotEmpty()
  @IsNumber()
  ram: number;

  @Column()
  @IsNotEmpty()
  @IsNumber()
  monthlyPrice: number;

  @Column()
  @IsNotEmpty()
  @IsNumber()
  hourlyPrice: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
