import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CPUPack } from './cpu-pack.entity';

@Injectable()
export class CpuPackService {
  constructor(
    @InjectRepository(CPUPack)
    private readonly packRepository: Repository<CPUPack>,
  ) {}

  async createCPUPack(payload: Partial<CPUPack>): Promise<CPUPack> {
    const pack = this.packRepository.create(payload);
    return this.packRepository.save(pack);
  }

  async getAllCPUPacks(): Promise<CPUPack[]> {
    return this.packRepository.find();
  }

  async getCPUPackById(id: number): Promise<CPUPack | null> {
    return this.packRepository.findOne({ where: { id } });
  }

  async updateCPUPack(
    id: number,
    payload: Partial<CPUPack>,
  ): Promise<CPUPack | null> {
    await this.packRepository.update(id, payload);
    return this.getCPUPackById(id);
  }

  async deleteCPUPack(id: number): Promise<void> {
    await this.packRepository.delete(id);
  }
}
