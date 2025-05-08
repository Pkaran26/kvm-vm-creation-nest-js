import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Subscription } from './subscription.entity';
import { Repository } from 'typeorm';
// import * as moment from 'moment';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
  ) {}

  async createSubscription(
    payload: Partial<Subscription>,
  ): Promise<Subscription> {
    // const oneDayAmount = payload.totalAmount
    //   ? payload.totalAmount / moment().daysInMonth()
    //   : 0;
    // const remainingDays =
    //   moment().daysInMonth() - moment().diff(moment().startOf('month'), 'days');
    // const totalAmount = oneDayAmount * remainingDays;
    const result = this.subscriptionRepository.create({
      ...payload,
      // totalAmount,
    });
    return await this.subscriptionRepository.save(result);
  }

  async getAllSubscriptions(): Promise<Subscription[]> {
    const subscriptions = await this.subscriptionRepository.find({
      relations: ['user'],
    });
    return subscriptions.map((e) => {
      return {
        ...e,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        metaData: JSON.parse(e.metaData as unknown as string),
      };
    });
  }

  async getSubscriptionById(id: number): Promise<Subscription | null> {
    const subscription = (await this.subscriptionRepository.findOne({
      where: { id },
      relations: ['user'],
    })) as Subscription;
    return subscription
      ? // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        { ...subscription, metaData: JSON.parse(subscription.metaData) }
      : null;
  }

  async closeSubscription(instanceName: string): Promise<Subscription | null> {
    const subscriptions = await this.subscriptionRepository.find({});
    for (let i = 0; i < subscriptions.length; i++) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const metaData = JSON.parse(subscriptions[i].metaData);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (metaData && metaData.vmName && metaData.vmName == instanceName) {
        await this.subscriptionRepository.update(subscriptions[i].id, {
          status: 'inactive',
        });
        return this.getSubscriptionById(subscriptions[i].id);
      }
    }
    return null;
  }
}
