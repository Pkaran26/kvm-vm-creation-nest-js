// invoice-item.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Invoice } from './invoice.entity';
import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

@Entity('invoice_items')
export class InvoiceItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Invoice, (invoice) => invoice, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'invoiceId' })
  invoice: Invoice;

  @Column()
  @IsNotEmpty()
  @IsNumber()
  invoiceId: number;

  @Column()
  @IsNotEmpty()
  @IsString()
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  @IsNotEmpty()
  @IsNumber()
  quantity: number; // e.g., 1 for monthly subscription, usage units

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  @IsNotEmpty()
  @IsNumber()
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  amount: number; // quantity * unitPrice

  @Column({ type: 'text' })
  @IsNotEmpty()
  @IsString()
  detail: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
