import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { StoragePoolService } from './storage-pool.service';
import { CreateStoragePool } from './storage-pool.interface';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';

@Controller('storage-pool')
export class StoragePoolController {
  constructor(private storagePoolService: StoragePoolService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getStoragePoolList() {
    return this.storagePoolService.getStoragePoolList();
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createStoragePool(@Body() body: CreateStoragePool) {
    return this.storagePoolService.createStoragePool(body);
  }
}
