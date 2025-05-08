import { Module } from '@nestjs/common';
import { InstancePackService } from './instance-pack.service';
import { InstancePackController } from './instance-pack.controller';
import { DiskPackService } from './disk-pack/disk-pack.service';
import { CpuPackService } from './cpu-pack/cpu-pack.service';
import { DiskPack } from './disk-pack/disk-pack.entity';
import { CPUPack } from './cpu-pack/cpu-pack.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([CPUPack, DiskPack])],
  providers: [InstancePackService, DiskPackService, CpuPackService],
  controllers: [InstancePackController],
})
export class InstancePackModule {}
