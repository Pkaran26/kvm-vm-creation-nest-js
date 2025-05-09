import { Module } from '@nestjs/common';
import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './invoice.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './invoice.entity';
import { Subscription } from 'src/subscription/subscription.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { InvoiceItem } from './invoice-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, Subscription, InvoiceItem]),
    ScheduleModule.forRoot(),
  ],
  controllers: [InvoiceController],
  providers: [InvoiceService],
})
export class InvoiceModule {}
