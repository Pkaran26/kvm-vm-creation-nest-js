import { Injectable } from '@nestjs/common';
import { HelperService } from 'src/helper/helper.service';
import { CreateStoragePool } from './storage-pool.interface';

@Injectable()
export class StoragePoolService {
  private SP_DIR = './storage-pool-dir';
  constructor(private helperService: HelperService) {}

  async getStoragePoolList() {
    try {
      const output = (await this.helperService.executeCommand(
        'virsh pool-list --all',
      )) as string;
      const list = this.helperService.parseCMDResponse(output);
      return { status: true, instances: list };
    } catch (error) {
      return {
        status: true,
        instances: [],
        error: 'Failed to list VMs',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        details: error,
      };
    }
  }

  async createStoragePool(payload: CreateStoragePool) {
    const { name } = payload;
    try {
      const output = (await this.helperService.executeCommand(
        `virsh pool-define-as --name ${name} --type dir --target ${this.SP_DIR}`,
      )) as string;

      const outputStart = (await this.helperService.executeCommand(
        `virsh pool-start ${name}`,
      )) as string;

      const outputAutoStart = (await this.helperService.executeCommand(
        `virsh pool-autostart ${name}`,
      )) as string;

      // const list = this.helperService.parseCMDResponse(output);
      return {
        status: true,
        detail: output,
        startStatus: outputStart,
        autoStartStatus: outputAutoStart,
      };
    } catch (error) {
      return {
        status: true,
        instances: [],
        error: 'Failed to create storage pool',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        details: error,
      };
    }
  }
}
