import { Controller, Get, UseGuards } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';

@Controller('invoice')
export class InvoiceController {
  constructor(private invoiceService: InvoiceService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async generateMonthlyInvoice() {
    return this.invoiceService.generateMonthlyInvoice(
      1,
      new Date('2025-05-31'),
    );
  }
}
