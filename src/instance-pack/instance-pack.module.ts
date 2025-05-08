import { Module } from '@nestjs/common';
import { InstancePackService } from './instance-pack.service';
import { InstancePackController } from './instance-pack.controller';
import { DiskPackService } from './disk-pack/disk-pack.service';
import { CpuPackService } from './cpu-pack/cpu-pack.service';

@Module({
  providers: [InstancePackService, DiskPackService, CpuPackService],
  controllers: [InstancePackController],
})
export class InstancePackModule {}
