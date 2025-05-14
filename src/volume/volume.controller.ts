import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { VolumeService } from './volume.service';
import {
  AttachVolume,
  CreateStoragePool,
  CreateVolume,
} from './volume.interface';

@Controller('volume')
export class VolumeController {
  constructor(private volumeService: VolumeService) {}

  @Post('/storage-pool')
  async createStoragePool(@Body() body: CreateStoragePool) {
    return this.volumeService.createStoragePool(body);
  }

  @Get('/storage-pool')
  async getStoragePoolList() {
    return this.volumeService.getStoragePoolList();
  }

  @Post()
  async createVolume(@Body() body: CreateVolume) {
    return this.volumeService.createVolume(body);
  }

  @Post('attach')
  async attachVolumeToInstance(@Body() body: AttachVolume) {
    return this.volumeService.attachVolumeToInstance(body);
  }

  @Get('detach/:name')
  async detachVolumeFromInstance(@Param() params: { name: string }) {
    return this.volumeService.detachVolumeFromInstance(params.name);
  }
}
