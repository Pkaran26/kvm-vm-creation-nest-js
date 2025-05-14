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
  UseGuards,
} from '@nestjs/common';
import { CpuPackService } from './cpu-pack/cpu-pack.service';
import { DiskPackService } from './disk-pack/disk-pack.service';
import { CreateCPUDto } from './cpu-pack/cpu-pack.dto';
import { CPUPack } from './cpu-pack/cpu-pack.entity';
import { CreateDiskDto } from './disk-pack/disk-pack.dto';
import { DiskPack } from './disk-pack/disk-pack.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';

@Controller()
export class InstancePackController {
  constructor(
    private cpuPackService: CpuPackService,
    private diskPackService: DiskPackService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('cpu-pack')
  async createCPUPack(@Body() body: CreateCPUDto): Promise<CPUPack> {
    return await this.cpuPackService.createCPUPack(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('cpu-pack')
  async getAllCPUPacks(): Promise<CPUPack[]> {
    return await this.cpuPackService.getAllCPUPacks();
  }

  @UseGuards(JwtAuthGuard)
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

  @UseGuards(JwtAuthGuard)
  @Delete('cpu-pack/:id')
  async deleteCPUPack(@Param('id', ParseIntPipe) id: number): Promise<void> {
    const pack = await this.cpuPackService.getCPUPackById(id);
    if (!pack) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return await this.cpuPackService.deleteCPUPack(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('disk-pack')
  async createDiskPack(@Body() body: CreateDiskDto): Promise<DiskPack> {
    return await this.diskPackService.createDiskPack(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('disk-pack')
  async getAllDiskPacks(): Promise<DiskPack[]> {
    return await this.diskPackService.getAllDiskPacks();
  }

  @UseGuards(JwtAuthGuard)
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

  @UseGuards(JwtAuthGuard)
  @Delete('disk-pack/:id')
  async deleteDiskPack(@Param('id', ParseIntPipe) id: number): Promise<void> {
    const pack = await this.diskPackService.getDiskPackById(id);
    if (!pack) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return await this.diskPackService.deleteDiskPack(id);
  }
}
