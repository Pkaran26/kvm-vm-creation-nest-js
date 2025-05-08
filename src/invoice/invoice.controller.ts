import { Controller, Get } from '@nestjs/common';
import { InvoiceService } from './invoice.service';

@Controller('invoice')
export class InvoiceController {
  constructor(private invoiceService: InvoiceService) {}

  @Get()
  async generateMonthlyInvoice() {
    return this.invoiceService.generateMonthlyInvoice(
      1,
      new Date('2025-05-31'),
    );
  }
}
