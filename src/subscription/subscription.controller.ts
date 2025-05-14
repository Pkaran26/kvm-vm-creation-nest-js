import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  UseGuards,
  // Post,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
// import { CreateSubscriptionDto } from './subscription.dto';
import { Subscription } from './subscription.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  // @Post()
  // async createSubscription(
  //   @Body() createSubscriptionDto: CreateSubscriptionDto,
  // ): Promise<Subscription> {
  //   return this.subscriptionService.createSubscription(createSubscriptionDto);
  // }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllSubscriptions(): Promise<Subscription[]> {
    return this.subscriptionService.getAllSubscriptions();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getSubscriptionById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Subscription> {
    const result = await this.subscriptionService.getSubscriptionById(id);
    if (!result) {
      throw new NotFoundException(`subscription with ID ${id} not found`);
    }
    return result;
  }
}
