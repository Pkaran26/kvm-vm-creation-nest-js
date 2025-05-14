/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { HelperService } from 'src/helper/helper.service';
import {
  AttachVolume,
  CreateStoragePool,
  CreateVolume,
} from './volume.interface';
import { WorkflowClient } from '@temporalio/client';
import { SubscriptionService } from 'src/subscription/subscription.service';
import { DiskPackService } from 'src/instance-pack/disk-pack/disk-pack.service';

@Injectable()
export class VolumeService {
  constructor(
    private helperService: HelperService,
    private readonly temporalClient: WorkflowClient,
    private subscriptionService: SubscriptionService,
    private diskPackService: DiskPackService,
  ) {}

  async createStoragePool(payload: CreateStoragePool) {
    try {
      const output = (await this.helperService.executeCommand(
        `virsh pool-define-as --name ${payload.name} --type dir --target ${payload.path}`,
      )) as string;
      const list = this.helperService.parseCMDResponse(output);
      return { status: true, instances: list };
    } catch (error) {
      return {
        status: true,
        instances: [],
        error: 'Failed to list storage pool',
        details: error,
      };
    }
  }

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
        error: 'Failed to list storage pool',
        details: error,
      };
    }
  }

  async createVolume(payload: CreateVolume) {
    const userId = 1;
    const diskPack = await this.diskPackService.getDiskPackById(
      payload.diskPackId,
    );
    if (!diskPack) {
      return {
        status: false,
        message: 'Disk pack not found',
      };
    }
    const handle = await this.temporalClient.start('createVolumeWorkflow', {
      args: [{ ...payload, capacity: diskPack.diskSize }],
      taskQueue: 'volume-queue',
      workflowId: `volume-${payload.name}-${Date.now()}`,
    });
    const { status, error, detail } = await handle.result();
    if (error) {
      return {
        status,
        message: error,
        detail,
      };
    }
    const subscription = status
      ? await this.subscriptionService.createSubscription({
          name: 'Volume Subscription',
          userId: userId,
          totalAmount: diskPack.monthlyPrice,
          status: 'active',
          metaData: JSON.stringify({
            volName: payload.name,
            diskPack: diskPack,
          }),
        })
      : null;

    return {
      status: status,
      volName: payload.name,
      workflowId: `volume-${payload.name}-${Date.now()}`,
      message: 'Volume created',
      subscription,
    };
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
