import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { CpuPackService } from './cpu-pack/cpu-pack.service';
import { DiskPackService } from './disk-pack/disk-pack.service';
import { CreateCPUDto } from './cpu-pack/cpu-pack.dto';
import { CPUPack } from './cpu-pack/cpu-pack.entity';
import { CreateDiskDto } from './disk-pack/disk-pack.dto';
import { DiskPack } from './disk-pack/disk-pack.entity';

@Controller()
export class InstancePackController {
  constructor(
    private cpuPackService: CpuPackService,
    private diskPackService: DiskPackService,
  ) {}

  @Post('cpu-pack')
  async createCPUPack(@Body() body: CreateCPUDto): Promise<CPUPack> {
    return await this.cpuPackService.createCPUPack(body);
  }

  @Get('cpu-pack')
  async getAllCPUPacks(): Promise<CPUPack[]> {
    return await this.cpuPackService.getAllCPUPacks();
  }

  @Put('cpu-pack/:id')
  async updateCPUPack(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateCPUDto,
  ): Promise<CPUPack> {
    const result = await this.cpuPackService.updateCPUPack(id, body);
    if (!result) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return result;
  }

  @Delete('cpu-pack/:id')
  async deleteCPUPack(@Param('id', ParseIntPipe) id: number): Promise<void> {
    const pack = await this.cpuPackService.getCPUPackById(id);
    if (!pack) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return await this.cpuPackService.deleteCPUPack(id);
  }

  @Post('disk-pack')
  async createDiskPack(@Body() body: CreateDiskDto): Promise<DiskPack> {
    return await this.diskPackService.createDiskPack(body);
  }

  @Get('disk-pack')
  async getAllDiskPacks(): Promise<DiskPack[]> {
    return await this.diskPackService.getAllDiskPacks();
  }

  @Put('disk-pack/:id')
  async updateDiskPack(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateDiskDto,
  ): Promise<DiskPack> {
    const result = await this.diskPackService.updateDiskPack(id, body);
    if (!result) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return result;
  }

  @Delete('disk-pack/:id')
  async deleteDiskPack(@Param('id', ParseIntPipe) id: number): Promise<void> {
    const pack = await this.diskPackService.getDiskPackById(id);
    if (!pack) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return await this.diskPackService.deleteDiskPack(id);
  }
}
