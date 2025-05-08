import { Module } from '@nestjs/common';
import { InstanceService } from './instance.service';
import { InstanceController } from './instance.controller';
import { HelperService } from 'src/helper/helper.service';

@Module({
  providers: [InstanceService, HelperService],
  controllers: [InstanceController],
})
export class InstanceModule {}
