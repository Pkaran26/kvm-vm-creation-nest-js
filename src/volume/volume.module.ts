import { Module } from '@nestjs/common';
import { VolumeController } from './volume.controller';
import { VolumeService } from './volume.service';
import { HelperService } from 'src/helper/helper.service';

@Module({
  controllers: [VolumeController],
  providers: [VolumeService, HelperService],
})
export class VolumeModule {}
