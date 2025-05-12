import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { User } from 'src/user/user.entity';

@Entity()
export class SSHKey {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsNotEmpty()
  @IsString()
  name: string;

  @Column()
  @IsNotEmpty()
  @IsString()
  privateKey: string;

  @Column()
  @IsNotEmpty()
  @IsString()
  publicKey: string;

  @OneToMany(() => User, (user) => user, {
    cascade: false,
    eager: false,
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ name: 'userId' })
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
