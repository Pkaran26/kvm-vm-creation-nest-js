import {
  IsNotEmpty,
  IsNumber,
  IsDate,
  IsPositive,
  IsString,
} from 'class-validator';

import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Subscription } from 'src/subscription/subscription.entity';
import { InvoiceItem } from './invoice-item.entity';
import { Relation } from 'typeorm';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Subscription, (subscription) => subscription, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'subscriptionId' })
  subscription: Subscription;

  @Column()
  @IsNotEmpty()
  @IsNumber()
  subscriptionId: number;

  @Column({ type: 'date' }) // TypeORM expects a Date object or 'YYYY-MM-DD' string
  @IsNotEmpty()
  @IsDate()
  invoiceDate: Date;

  @Column({ type: 'date' })
  @IsNotEmpty()
  @IsDate()
  billingPeriodStart: Date;

  @Column({ type: 'date' })
  @IsNotEmpty()
  @IsDate()
  billingPeriodEnd: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  amountDue: number;

  @Column()
  @IsNotEmpty()
  @IsString()
  status: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @OneToMany(() => InvoiceItem, (item) => item)
  items: Relation<InvoiceItem[]>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
