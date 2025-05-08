import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiskPack } from './disk-pack.entity';

@Injectable()
export class DiskPackService {
  constructor(
    @InjectRepository(DiskPack)
    private readonly packRepository: Repository<DiskPack>,
  ) {}

  async createDiskPack(payload: Partial<DiskPack>): Promise<DiskPack> {
    const pack = this.packRepository.create(payload);
    return this.packRepository.save(pack);
  }

  async getAllDiskPacks(): Promise<DiskPack[]> {
    return this.packRepository.find();
  }

  async getDiskPackById(id: number): Promise<DiskPack | null> {
    return this.packRepository.findOne({ where: { id } });
  }

  async updateDiskPack(
    id: number,
    payload: Partial<DiskPack>,
  ): Promise<DiskPack | null> {
    await this.packRepository.update(id, payload);
    return this.getDiskPackById(id);
  }

  async deleteDiskPack(id: number): Promise<void> {
    await this.packRepository.delete(id);
  }
}
