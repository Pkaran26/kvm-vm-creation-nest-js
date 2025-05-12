import { Module } from '@nestjs/common';
import { VolumeController } from './volume.controller';
import { VolumeService } from './volume.service';
import { HelperService } from 'src/helper/helper.service';
import { SubscriptionService } from 'src/subscription/subscription.service';
import { DiskPackService } from 'src/instance-pack/disk-pack/disk-pack.service';
import { Subscription } from 'src/subscription/subscription.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiskPack } from 'src/instance-pack/disk-pack/disk-pack.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Subscription, DiskPack])],
  controllers: [VolumeController],
  providers: [
    VolumeService,
    HelperService,
    SubscriptionService,
    DiskPackService,
  ],
})
export class VolumeModule {}
