import { Injectable } from '@nestjs/common';
import { existsSync, writeFileSync, unlinkSync, mkdirSync, unlink } from 'fs';
import { join, basename } from 'path';
import { CreateInstanceRequest } from './instance.interface';
import { osDownloadMap } from 'src/os-mapping';
import { HelperService } from 'src/helper/helper.service';
import { SubscriptionService } from 'src/subscription/subscription.service';
import { CpuPackService } from 'src/instance-pack/cpu-pack/cpu-pack.service';
import { DiskPackService } from 'src/instance-pack/disk-pack/disk-pack.service';

@Injectable()
export class InstanceService {
  constructor(
    private helperService: HelperService,
    private subscriptionService: SubscriptionService,
    private cpuPackService: CpuPackService,
    private diskPackService: DiskPackService,
  ) {}

  async createInstance(body: CreateInstanceRequest) {
    /**memory: number;
  vcpu: number;
  diskSizeGB: number; */
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

    const VM_NAME = body.instanceName + '-' + Math.random().toString();
    const SELECTED_OS =
      osDownloadMap[body.isoImageName as keyof typeof osDownloadMap];
    if (!SELECTED_OS)
      return { status: false, error: 'isoImageName is invalid' };

    const OS_IMAGE_URL = SELECTED_OS.url;
    const DOWNLOAD_DIR = './vm_images';
    const BASE_IMAGE_NAME = SELECTED_OS.filename;
    const VM_DISK_NAME = `${VM_NAME}.qcow2`;
    const CLOUD_INIT_ISO_NAME = `${VM_NAME}-cloud-init.iso`;

    const VM_MEMORY = (cpuPack.ram * 1024).toString();
    const VM_VCPUS = cpuPack.cpu.toString();
    const VM_DISK_SIZE = `${diskPack.diskSize}G`;

    const SSH_PUBLIC_KEY = body.ssh;
    const USERNAME = SELECTED_OS.username;
    const HOSTNAME = VM_NAME;

    // Paths
    const baseImagePath = join(DOWNLOAD_DIR, BASE_IMAGE_NAME);
    const vmDiskPath = join(DOWNLOAD_DIR, VM_DISK_NAME);
    const cloudInitDir = join(DOWNLOAD_DIR, 'cloud-init-data');
    const userDataPath = join(cloudInitDir, 'user-data');
    const metaDataPath = join(cloudInitDir, 'meta-data');
    const cloudInitIsoPath = join(DOWNLOAD_DIR, CLOUD_INIT_ISO_NAME);

    function createDirectories() {
      console.log('[INFO] Creating necessary directories...');
      [DOWNLOAD_DIR, cloudInitDir].forEach((dir) => {
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true });
          console.log(`Created directory: ${dir}`);
        }
      });
    }
    try {
      createDirectories();
      if (!existsSync(baseImagePath)) {
        await this.helperService.executeCommand(
          `wget -O ${baseImagePath} ${OS_IMAGE_URL}`,
        );
      } else {
        console.log(
          `[INFO] Base image ${baseImagePath} already exists. Skipping download.`,
        );
      }

      if (existsSync(vmDiskPath)) {
        console.warn(
          `[WARN] VM disk ${vmDiskPath} already exists. Deleting and recreating.`,
        );
        unlinkSync(vmDiskPath);
      }
      await this.helperService.executeCommand(
        `qemu-img create -f qcow2 -b ${basename(
          baseImagePath,
        )} -F qcow2 ${vmDiskPath} ${VM_DISK_SIZE}`,
      );
      console.log('[INFO] Preparing cloud-init data...');
      const userDataContent = `\
#cloud-config
users:
  - name: ${USERNAME}
    sudo: ALL=(ALL) NOPASSWD:ALL
    groups: users, admin
    home: /home/${USERNAME}
    shell: /bin/bash
    lock_passwd: true
    ssh_authorized_keys:
      - ${SSH_PUBLIC_KEY}
hostname: ${HOSTNAME}
manage_etc_hosts: true
# Optional: Update packages on first boot
# package_update: true
# package_upgrade: true
# packages:
#  - qemu-guest-agent
# runcmd:
#  - [ systemctl, enable, qemu-guest-agent.service ]
#  - [ systemctl, start, --no-block, qemu-guest-agent.service ]
`;
      writeFileSync(userDataPath, userDataContent);

      const metaDataContent = `\
instance-id: ${VM_NAME}-instance-01
local-hostname: ${HOSTNAME}
`;
      writeFileSync(metaDataPath, metaDataContent);
      console.log(`Cloud-init user-data written to: ${userDataPath}`);
      console.log(`Cloud-init meta-data written to: ${metaDataPath}`);

      // 4. Create cloud-init ISO
      // Ensure 'genisoimage' or 'mkisofs' is installed.
      // The volume ID 'cidata' is standard for cloud-init.
      if (existsSync(cloudInitIsoPath)) {
        console.warn(
          `[WARN] Cloud-init ISO ${cloudInitIsoPath} already exists. Deleting and recreating.`,
        );
        unlinkSync(cloudInitIsoPath);
      }
      // Check for genisoimage, fallback to mkisofs
      let isoCommand = 'genisoimage';
      try {
        await this.helperService.executeCommand('command -v genisoimage');
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        console.log('[INFO] genisoimage not found, trying mkisofs.');
        try {
          await this.helperService.executeCommand('command -v mkisofs');
          isoCommand = 'mkisofs';
        } catch (e2) {
          console.error(
            '[ERROR] Neither genisoimage nor mkisofs found. Please install one of them.',
          );
          throw e2;
        }
      }

      await this.helperService.executeCommand(
        `${isoCommand} -output ${cloudInitIsoPath} -volid cidata -joliet -rock ${userDataPath} ${metaDataPath}`,
      );
      console.log(
        '[INFO] Ensure you have permissions to run virt-install (often requires sudo).',
      );
      const virtInstallCommand = `\
sudo virt-install \\
    --name ${VM_NAME} \\
    --memory ${VM_MEMORY} \\
    --vcpus ${VM_VCPUS} \\
    --disk path=${vmDiskPath},device=disk,bus=virtio,format=qcow2 \\
    --disk path=${cloudInitIsoPath},device=cdrom \\
    --os-variant ${SELECTED_OS.variant} \\
    --virt-type kvm \\
    --graphics vnc,listen=0.0.0.0 \\
    --network network=${body.network},model=virtio \\
    --import \\
    --noautoconsole`;
      // For Ubuntu Noble (24.04), 'ubuntunoble' is the expected os-variant.
      // If 'ubuntunoble' isn't recognized, try a more generic 'ubuntu22.04' or 'generic' and check 'osinfo-query os'.

      await this.helperService.executeCommand(virtInstallCommand);

      console.log(`\n--- VM ${VM_NAME} Creation Process Completed ---`);
      console.log(`VM Disk: ${vmDiskPath}`);
      console.log(`Cloud-init ISO: ${cloudInitIsoPath}`);
      console.log(`\n[NEXT STEPS]`);
      console.log(`1. Check VM status: sudo virsh list --all`);
      console.log(
        `2. If running, find its IP address: sudo virsh domifaddr ${VM_NAME}`,
      );
      console.log(
        `   (Cloud-init might take a minute or two to apply network settings and get an IP)`,
      );
      console.log(
        `3. Connect via SSH: ssh ${USERNAME}@<VM_IP_ADDRESS> (using the SSH key you provided)`,
      );
      console.log(
        `4. To access the console/display: Use a VNC client to connect to your host's IP and the VNC port assigned by libvirt (check with 'sudo virsh vncdisplay ${VM_NAME}')`,
      );
      console.log(
        `5. To manage the VM: sudo virsh <command> ${VM_NAME} (e.g., shutdown, start, destroy)`,
      );
      const subscription = await this.subscriptionService.createSubscription({
        name: 'Instance Subscription',
        userId: 1,
        totalAmount: cpuPack.monthlyPrice + diskPack.monthlyPrice,
        status: 'active',
        metaData: JSON.stringify({
          vmName: VM_NAME,
          cpuPack: cpuPack,
          diskPack: diskPack,
        }),
      });
      const instance = await this.getInstanceDetail(VM_NAME);
      return {
        status: true,
        instanceDetail: instance,
        subscription: subscription,
        message: 'Instance created successfully',
      };
    } catch (error) {
      console.log(error);
      return {
        status: false,
        instanceDetail: {},
        message: 'Instance creation failed',
      };
    }
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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
