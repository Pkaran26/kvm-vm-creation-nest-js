import { Injectable } from '@nestjs/common';
import { HelperService } from 'src/helper/helper.service';
import { AttachVolume, CreateVolume } from './volume.interface';

@Injectable()
export class VolumeService {
  constructor(private helperService: HelperService) {}

  async createVolume(payload: CreateVolume) {
    const { name, storagePool, capacity } = payload;
    try {
      const output = (await this.helperService.executeCommand(
        `virsh vol-create-as --pool ${storagePool} --name ${name} --capacity ${capacity}G --format qcow2`,
      )) as string;

      // const list = this.helperService.parseCMDResponse(output);
      return {
        status: true,
        detail: output,
      };
    } catch (error) {
      return {
        status: true,
        error: 'Failed to create volume',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        details: error,
      };
    }
  }

  async attachVolumeToInstance(payload: AttachVolume) {
    const { volumeName, instanceName, storagePool } = payload;
    try {
      const volumePath = (await this.helperService.executeCommand(
        `virsh vol-path ${storagePool} ${volumeName}`,
      )) as string;

      if (!volumePath) {
        return {
          status: false,
          error: `Volume path not found for ${volumeName}`,
        };
      }

      const output = (await this.helperService.executeCommand(
        `virsh attach-disk --domain ${instanceName} --source ${volumePath} --target vdb --persistent --type disk --driver qemu`,
      )) as string;

      // const list = this.helperService.parseCMDResponse(output);
      return {
        status: true,
        detail: output,
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

  async getInstanDetail(instanceName: string) {
    const vmInfo = {
      State: '',
    };

    try {
      const instance = (await this.helperService.executeCommand(
        `virsh dominfo ${instanceName}`,
      )) as string;
      const lines = instance
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line !== '');

      lines.forEach((line) => {
        const [key, value] = line.split(':').map((item) => item.trim());
        vmInfo[key] = value;
      });
      return vmInfo;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return null;
    }
  }

  async detachVolumeFromInstance(instanceName: string) {
    const vmInfo = await this.getInstanDetail(instanceName);

    if (!vmInfo) {
      return {
        status: false,
        message: `${instanceName} not found`,
      };
    }

    if (vmInfo.State !== 'shut off') {
      return {
        status: false,
        message: `${instanceName} is running. Please stop the instance and try again`,
      };
    }

    try {
      await this.helperService.executeCommand(
        `virsh detach-disk --domain ${instanceName} --target vdb --config`,
      );

      const output = (await this.helperService.executeCommand(
        `virsh domblklist ${instanceName}`,
      )) as string;

      const status = output.indexOf('vdb') > -1 ? true : false;

      return {
        status: status,
        message: status ? 'Volume detached' : 'Failed to detach the volume',
      };
    } catch (error) {
      return {
        status: false,
        message: 'Failed to detach the volume',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        detail: error,
      };
    }
  }

  // async downloadVolume(payload: any) {
  //   const { storagePool, volumeName } = payload;
  //   try {
  //     const output = (await this.helperService.executeCommand(
  //       `virsh vol-download --pool ${storagePool} ${volumeName} /path/to/destination/my_volume_downloaded.qcow2`,
  //     )) as string;
  //   } catch (error) {}
  // }
}
