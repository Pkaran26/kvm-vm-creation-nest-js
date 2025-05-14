import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { VolumeService } from './volume.service';
import {
  AttachVolume,
  CreateStoragePool,
  CreateVolume,
} from './volume.interface';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { User } from 'src/user/user.entity';

@Controller('volume')
export class VolumeController {
  constructor(private volumeService: VolumeService) {}

  @UseGuards(JwtAuthGuard)
  @Post('/storage-pool')
  async createStoragePool(@Body() body: CreateStoragePool) {
    return this.volumeService.createStoragePool(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/storage-pool')
  async getStoragePoolList() {
    return this.volumeService.getStoragePoolList();
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createVolume(@Body() body: CreateVolume, @Request() req) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.volumeService.createVolume(body, req.user as User);
  }

  @UseGuards(JwtAuthGuard)
  @Post('attach')
  async attachVolumeToInstance(@Body() body: AttachVolume) {
    return this.volumeService.attachVolumeToInstance(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('detach/:name')
  async detachVolumeFromInstance(@Param() params: { name: string }) {
    return this.volumeService.detachVolumeFromInstance(params.name);
  }
}
