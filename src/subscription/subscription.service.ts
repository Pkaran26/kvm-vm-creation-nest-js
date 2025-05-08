import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Subscription } from './subscription.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
  ) {}

  async createSubscription(
    payload: Partial<Subscription>,
  ): Promise<Subscription> {
    const result = this.subscriptionRepository.create(payload);
    return this.subscriptionRepository.save(result);
  }

  async getAllSubscriptions(): Promise<Subscription[]> {
    return this.subscriptionRepository.find({
      relations: ['cpuPack', 'diskPack', 'user'],
    });
  }

  async getSubscriptionById(id: number): Promise<Subscription | null> {
    return this.subscriptionRepository.findOne({
      where: { id },
      relations: ['cpuPack', 'diskPack', 'user'],
    });
  }
}
