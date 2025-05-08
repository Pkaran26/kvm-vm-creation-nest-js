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
import { CPUPack } from 'src/instance-pack/cpu-pack/cpu-pack.entity';
import { DiskPack } from 'src/instance-pack/disk-pack/disk-pack.entity';
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

  @ManyToOne(() => CPUPack, (pack) => pack, {
    cascade: false,
    eager: false,
  })
  @JoinColumn({ name: 'cpuPackId' })
  cpuPack: CPUPack;

  @Column({ name: 'cpuPackId' })
  @IsNotEmpty()
  @IsNumber()
  cpuPackId: number;

  @ManyToOne(() => DiskPack, (pack) => pack, {
    cascade: false,
    eager: false,
  })
  @JoinColumn({ name: 'diskPackId' })
  diskPack: DiskPack;

  @Column({ name: 'diskPackId' })
  @IsNotEmpty()
  @IsNumber()
  diskPackId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
