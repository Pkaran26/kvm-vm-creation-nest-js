/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { unlink } from 'fs';
import { join } from 'path';
import { CreateInstanceRequest } from './instance.interface';
import { HelperService } from 'src/helper/helper.service';
import { SubscriptionService } from 'src/subscription/subscription.service';
import { CpuPackService } from 'src/instance-pack/cpu-pack/cpu-pack.service';
import { DiskPackService } from 'src/instance-pack/disk-pack/disk-pack.service';
import { WorkflowClient } from '@temporalio/client';
import { osDownloadMap } from 'src/os-mapping';
import { SshKeyService } from 'src/ssh-key/ssh-key.service';

@Injectable()
export class InstanceService {
  constructor(
    private helperService: HelperService,
    private subscriptionService: SubscriptionService,
    private cpuPackService: CpuPackService,
    private diskPackService: DiskPackService,
    private readonly temporalClient: WorkflowClient,
    private sshKeyService: SshKeyService,
  ) {}

  async createInstance(body: CreateInstanceRequest) {
    const userId = 1;
    const sshKeys = await this.sshKeyService.getSSHKeyByName(userId, body.ssh);
    if (!sshKeys || sshKeys.length == 0) {
      return {
        status: false,
        instanceName: '',
        message: 'SSH key not found!',
      };
    }
    const SELECTED_OS =
      osDownloadMap[body.isoImageName as keyof typeof osDownloadMap];
    if (!SELECTED_OS)
      return {
        status: false,
        instanceName: '',
        message: 'isoImageName is invalid',
      };
    const cpuPack = await this.cpuPackService.getCPUPackById(body.cpuPackId);
    const diskPack = await this.diskPackService.getDiskPackById(
      body.diskPackId,
    );
    if (!cpuPack) {
      return {
        status: false,
        message: 'CPU pack not found',
      };
    }
    if (!diskPack) {
      return {
        status: false,
        message: 'Disk pack not found',
      };
    }
    const handle = await this.temporalClient.start('createInstanceWorkflow', {
      args: [
        {
          ...body,
          cpuPack,
          diskPack,
          SELECTED_OS,
          ssh: sshKeys[0].publicKey,
        },
      ],
      taskQueue: 'instance-queue',
      workflowId: `instance-${body.instanceName}-${Date.now()}`,
    });
    const { status, instanceName, message } = await handle.result();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const instance = status ? await this.getInstanceDetail(instanceName) : null;
    const subscription = status
      ? await this.subscriptionService.createSubscription({
          name: 'Instance Subscription',
          userId: userId,
          totalAmount: cpuPack.monthlyPrice + diskPack.monthlyPrice,
          status: 'active',
          metaData: JSON.stringify({
            vmName: instanceName,
            cpuPack: cpuPack,
            diskPack: diskPack,
          }),
        })
      : null;

    return {
      status: status,
      instanceDetail: instance,
      workflowId: `instance-${body.instanceName}-${Date.now()}`,
      message: message,
      subscription,
    };
  }

  async getInstanceList() {
    try {
      const output = (await this.helperService.executeCommand(
        'virsh list --all',
      )) as string;
      const list = this.helperService.parseCMDResponse(output);
      return { status: true, instances: list };
    } catch (error) {
      return {
        status: true,
        instances: [],
        error: 'Failed to list VMs',
        details: error,
      };
    }
  }

  async getInstanceDetail(instanceName: string) {
    try {
      const output = (await this.helperService.executeCommand(
        `virsh dominfo ${instanceName}`,
      )) as string;
      let output2 = '';
      try {
        output2 = (await this.helperService.executeCommand(
          `virsh domifaddr ${instanceName}`,
        )) as string;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        /* empty */
      }
      const lines = output
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line !== '');
      const vmInfo = {
        Name: '',
        Address: '',
      };
      lines.forEach((line) => {
        const [key, value] = line.split(':').map((item) => item.trim());
        vmInfo[key] = value;
      });
      const instanceAddr: { Address: string } | string = output2
        ? (this.helperService.parseCMDResponse(output2)[0] as {
            Address: string;
          })
        : '';
      let payload = {};
      if (instanceAddr && typeof instanceAddr == 'object') {
        payload = {
          ...instanceAddr,
          Address: instanceAddr.Address.split('/')[0],
        };
      }
      return {
        status: true,
        instanceDetail: {
          ...vmInfo,
          instanceName: vmInfo.Name,
          ...payload,
        },
      };
    } catch (error) {
      return {
        status: true,
        instanceDetail: {},
        error: `VM "${instanceName}" not found or details unavailable`,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        details: error,
      };
    }
  }

  async performInstanceAction(instanceName: string, action: string) {
    try {
      const output = await this.helperService.executeCommand(
        `virsh ${action} ${instanceName}`,
      );
      const message =
        action == 'start'
          ? 'started'
          : action == 'shutdown'
            ? 'shut down'
            : action == 'destroy'
              ? 'powered off'
              : '';
      return {
        status: true,
        message: `VM "${instanceName}" ${message} successfully`,
        details: output,
      };
    } catch (error) {
      return {
        status: true,
        error: `Failed to start VM "${instanceName}"`,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        details: error,
      };
    }
  }

  async deleteInstance(instanceName: string) {
    try {
      await this.subscriptionService.closeSubscription(instanceName);
      await this.helperService.executeCommand(`virsh destroy ${instanceName}`);
      await this.helperService.executeCommand(`virsh undefine ${instanceName}`);
      const VM_IMAGE_BASE_PATH = '/var/lib/libvirt/images';
      const imageName = `${instanceName}.qcow2`;
      const diskPath = join(VM_IMAGE_BASE_PATH, imageName);

      try {
        unlink(diskPath, (err) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          err ? console.log(err) : '';
        });
        console.log(`Disk image "${diskPath}" deleted.`);
      } catch (err) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (err && err.code === 'ENOENT') {
          console.log(`Disk image "${diskPath}" not found, skipping deletion.`);
        } else {
          console.error(`Error deleting disk image "${diskPath}": ${err}`);
          // Optionally, you might want to still consider the VM deletion successful
          // even if disk deletion fails, or return an error.
        }
      }

      return {
        status: true,
        message: `VM "${instanceName}" deleted successfully.`,
      };
    } catch (error) {
      return {
        status: false,
        error: `Failed to delete VM "${instanceName}"`,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        details: error,
      };
    }
  }

  async attachedVolumes(instanceName: string) {
    try {
      const output = (await this.helperService.executeCommand(
        `virsh domblklist ${instanceName}`,
      )) as string;
      const list = this.helperService.parseCMDResponse(output);
      return {
        status: true,
        volumes: list.map((e: { Source: string; Target: string }) => {
          return {
            ...e,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
            Name: e.Source.split('/')[e.Source.split('/').length - 1],
            rootVolume: e.Target == 'vda' || e.Target == 'sda' ? true : false,
          };
        }),
      };
    } catch (error) {
      return {
        status: true,
        volumes: [],
        error: 'Failed to list Volumes',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        details: error,
      };
    }
  }
}
