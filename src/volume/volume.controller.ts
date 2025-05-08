import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { VolumeService } from './volume.service';
import { AttachVolume, CreateVolume } from './volume.interface';

@Controller('volume')
export class VolumeController {
  constructor(private volumeService: VolumeService) {}

  @Post()
  async createVolume(@Body() body: CreateVolume) {
    return this.volumeService.createVolume(body);
  }

  @Post()
  async attachVolumeToInstance(@Body() body: AttachVolume) {
    return this.volumeService.attachVolumeToInstance(body);
  }

  @Get(':name')
  async detachVolumeFromInstance(@Param() params: { name: string }) {
    return this.volumeService.detachVolumeFromInstance(params.name);
  }
}
