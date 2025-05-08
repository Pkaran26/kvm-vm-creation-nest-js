/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as moment from 'moment';
import { Repository } from 'typeorm';
import { Invoice } from './invoice.entity';
import { InvoiceStatus } from './invoice.status.enum';
import { Subscription } from 'src/subscription/subscription.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
  ) {}

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT, {
    name: 'monthlyInvoiceGeneration',
    timeZone: 'UTC',
  })
  async handleMonthlyInvoiceGenerationCron() {
    this.logger.log('Starting monthly invoice generation cron job...');
    const today = moment.utc().toDate();

    const activeSubscriptions = await this.subscriptionRepository.find({
      where: { status: 'active' }, // Ensure 'active' matches your Subscription entity's status
    });

    if (!activeSubscriptions || activeSubscriptions.length === 0) {
      this.logger.log(
        'No active subscriptions found. Skipping invoice generation.',
      );
      return;
    }

    this.logger.log(
      `Found ${activeSubscriptions.length} active subscriptions to process.`,
    );

    for (const subscription of activeSubscriptions) {
      try {
        const billingMonthMoment = moment.utc(today);
        const billingPeriodStart = billingMonthMoment
          .clone()
          .startOf('month')
          .toDate();
        const billingPeriodEnd = billingMonthMoment
          .clone()
          .endOf('month')
          .toDate();

        const existingInvoice = await this.invoiceRepository.findOne({
          where: {
            subscriptionId: subscription.id,
            billingPeriodStart: billingPeriodStart,
            billingPeriodEnd: billingPeriodEnd,
          },
        });

        if (existingInvoice) {
          this.logger.log(
            `Invoice already exists for subscription ${subscription.id} for billing period ${billingMonthMoment.format('YYYY-MM')}. Skipping.`,
          );
          continue;
        }

        this.logger.log(
          `Generating invoice for subscription ${subscription.id} for billing period ${billingMonthMoment.format('YYYY-MM')}.`,
        );
        await this.generateMonthlyInvoice(subscription.id, today); // Call the invoice generation function
        this.logger.log(
          `Successfully generated invoice for subscription ${subscription.id}.`,
        );
      } catch (error) {
        this.logger.error(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          `Failed to generate invoice for subscription ${subscription.id}: ${error.message}`,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          error.stack,
        );
      }
    }
    this.logger.log('Monthly invoice generation cron job finished.');
  }

  async generateMonthlyInvoice(
    subscriptionId: number,
    billingMonthDate: Date,
  ): Promise<Invoice> {
    const billingMonthMoment = moment.utc(billingMonthDate);
    this.logger.log(
      `Attempting to generate invoice for subscription ${subscriptionId} for month of ${billingMonthMoment.format('YYYY-MM')}`,
    );

    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
    });
    if (!subscription) {
      this.logger.error(`Subscription with ID ${subscriptionId} not found.`);
      throw new NotFoundException(
        `Subscription with ID ${subscriptionId} not found.`,
      );
    }

    // --- Determine Billing Period ---
    const billingPeriodStartMoment = billingMonthMoment
      .clone()
      .startOf('month');
    const billingPeriodEndMoment = billingMonthMoment.clone().endOf('month');

    // --- Determine Subscription Active Period ---
    const subscriptionStartMoment = moment.utc(subscription.createdAt);
    let subscriptionEndMoment: moment.Moment | null = null;
    if (
      subscription.status.toLowerCase() === 'inactive' ||
      subscription.status.toLowerCase() === 'cancelled'
    ) {
      subscriptionEndMoment = moment.utc(subscription.updatedAt);
    }

    // --- Calculate Effective Service Dates within the Billing Period ---
    const effectiveStartMoment = moment.max(
      subscriptionStartMoment,
      billingPeriodStartMoment,
    );
    const effectiveEndMoment = subscriptionEndMoment
      ? moment.min(subscriptionEndMoment, billingPeriodEndMoment)
      : billingPeriodEndMoment;

    if (effectiveEndMoment.isBefore(effectiveStartMoment)) {
      this.logger.log(
        `Subscription ${subscriptionId} effective activity period (${effectiveStartMoment.toISOString()} to ${effectiveEndMoment.toISOString()}) is invalid or zero for ${billingMonthMoment.format('YYYY-MM')}. No charge for this period.`,
      );
      const zeroInvoice = this.invoiceRepository.create({
        subscription,
        subscriptionId: subscription.id,
        invoiceDate: moment.utc().toDate(),
        billingPeriodStart: billingPeriodStartMoment.toDate(),
        billingPeriodEnd: billingPeriodEndMoment.toDate(),
        amountDue: 0,
        status: InvoiceStatus.CANCELLED,
        notes: 'Subscription not active during any part of the billing period.',
      });
      return this.invoiceRepository.save(zeroInvoice);
    }

    // --- Calculate Prorated Amount ---
    const daysInMonth = billingMonthMoment.daysInMonth();
    const activeDays =
      effectiveEndMoment.diff(effectiveStartMoment, 'days') + 1;
    const proratedFactor = activeDays / daysInMonth;
    const finalAmountDue = parseFloat(
      (subscription.totalAmount * proratedFactor).toFixed(2),
    );

    this.logger.log(
      `Subscription ${subscriptionId}: Monthly Price: ${subscription.totalAmount}, Billing Period: ${billingPeriodStartMoment.format('YYYY-MM-DD')} to ${billingPeriodEndMoment.format('YYYY-MM-DD')}, Active Days: ${activeDays}, Prorated Amount: ${finalAmountDue}`,
    );

    const newInvoice = this.invoiceRepository.create({
      subscription,
      subscriptionId: subscription.id,
      invoiceDate: moment.utc().toDate(),
      billingPeriodStart: billingPeriodStartMoment.toDate(),
      billingPeriodEnd: billingPeriodEndMoment.toDate(),
      amountDue: finalAmountDue,
      status: InvoiceStatus.PENDING,
      notes:
        activeDays < daysInMonth
          ? `Prorated for ${activeDays} out of ${daysInMonth} days of service.`
          : 'Full monthly service period.',
    });

    return this.invoiceRepository.save(newInvoice);
  }

  async findInvoiceById(id: number): Promise<Invoice | null> {
    return this.invoiceRepository.findOne({
      where: { id },
      relations: ['subscription'],
    });
  }

  async updateInvoiceStatus(
    id: number,
    status: InvoiceStatus,
  ): Promise<Invoice> {
    const invoice = await this.findInvoiceById(id);
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found.`);
    }
    invoice.status = status;
    // invoice.updatedAt will be automatically updated by TypeORM
    return this.invoiceRepository.save(invoice);
  }

  async getInvoicesForSubscription(subscriptionId: number): Promise<Invoice[]> {
    return this.invoiceRepository.find({
      where: { subscriptionId },
      order: { invoiceDate: 'DESC' }, // Keep as 'DESC' for chronological order
    });
  }
}
