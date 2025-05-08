import { Body, Controller, Get, Post } from '@nestjs/common';
import { StoragePoolService } from './storage-pool.service';
import { CreateStoragePool } from './storage-pool.interface';

@Controller('storage-pool')
export class StoragePoolController {
  constructor(private storagePoolService: StoragePoolService) {}

  @Get()
  async getStoragePoolList() {
    return this.storagePoolService.getStoragePoolList();
  }

  @Post()
  async createStoragePool(@Body() body: CreateStoragePool) {
    return this.storagePoolService.createStoragePool(body);
  }
}
