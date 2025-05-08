import { Module } from '@nestjs/common';
import { InstanceService } from './instance.service';
import { InstanceController } from './instance.controller';
import { HelperService } from 'src/helper/helper.service';
import { SubscriptionService } from 'src/subscription/subscription.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from 'src/subscription/subscription.entity';
import { CPUPack } from 'src/instance-pack/cpu-pack/cpu-pack.entity';
import { DiskPack } from 'src/instance-pack/disk-pack/disk-pack.entity';
import { CpuPackService } from 'src/instance-pack/cpu-pack/cpu-pack.service';
import { DiskPackService } from 'src/instance-pack/disk-pack/disk-pack.service';

@Module({
  imports: [TypeOrmModule.forFeature([Subscription, CPUPack, DiskPack])],
  providers: [
    InstanceService,
    HelperService,
    SubscriptionService,
    CpuPackService,
    DiskPackService,
  ],
  controllers: [InstanceController],
})
export class InstanceModule {}
