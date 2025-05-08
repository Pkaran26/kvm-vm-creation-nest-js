/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { User } from 'src/user/user.entity';

@Entity()
export class Subscription {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ManyToOne(() => User, (user) => user, {
    cascade: false,
    eager: false,
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ name: 'userId' })
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @Column()
  @IsNotEmpty()
  @IsNumber()
  totalAmount: number;

  @Column()
  @IsNotEmpty()
  @IsString()
  status: string; // active // inactive

  @Column({ type: 'text' })
  @IsNotEmpty()
  @IsString()
  metaData: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
