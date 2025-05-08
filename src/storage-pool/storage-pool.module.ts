import { Module } from '@nestjs/common';
import { StoragePoolService } from './storage-pool.service';
import { StoragePoolController } from './storage-pool.controller';
import { HelperService } from 'src/helper/helper.service';

@Module({
  providers: [StoragePoolService, HelperService],
  controllers: [StoragePoolController],
})
export class StoragePoolModule {}
