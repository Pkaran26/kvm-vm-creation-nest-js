import { Module } from '@nestjs/common';
import { NetworkService } from './network.service';
import { NetworkController } from './network.controller';
import { HelperService } from 'src/helper/helper.service';

@Module({
  providers: [NetworkService, HelperService],
  controllers: [NetworkController],
})
export class NetworkModule {}
