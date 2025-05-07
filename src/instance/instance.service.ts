import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { existsSync, writeFileSync, unlinkSync, mkdirSync, unlink } from 'fs';
import { join, basename } from 'path';
import { CreateInstanceRequest } from './instance.interface';
import { osDownloadMap } from 'src/os-mapping';

@Injectable()
export class InstanceService {
  executeCommand(command: string, timeout: number = 30000) {
    return new Promise((resolve, reject) => {
      exec(command, { timeout }, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing command: ${command}`);
          console.error(stderr);
          // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
          reject(stderr);
          return;
        }
        resolve(stdout.trim());
      });
    });
  }

  parseCMDResponse(text: string) {
    const lines = text.trim().split('\n');
    const header = lines[0].split(/\s{2,}/).map((s) => s.trim()); // Split by 2+ spaces and trim
    const dataLines = lines.slice(2); // Skip header and separator

    return dataLines.map((line) => {
      const values = line.split(/\s{2,}/).map((v) => v.trim()); // Split by 2+ spaces and trim
      const obj = {};
      header.forEach((key, index) => {
        obj[key] = values[index];
      });
      return obj;
    });
  }

  async createInstance(body: CreateInstanceRequest) {
    // --- Configuration ---
    const VM_NAME = body.instanceName; //"ubuntu-noble-vm-2";
    const SELECTED_OS =
      osDownloadMap[body.isoImageName as keyof typeof osDownloadMap];
    if (!SELECTED_OS)
      return { status: false, error: 'isoImageName is invalid' };

    const OS_IMAGE_URL = SELECTED_OS.url;
    const DOWNLOAD_DIR = './vm_images'; // Directory to store downloaded and created images
    const BASE_IMAGE_NAME = SELECTED_OS.filename;
    const VM_DISK_NAME = `${VM_NAME}.qcow2`;
    const CLOUD_INIT_ISO_NAME = `${VM_NAME}-cloud-init.iso`;

    const VM_MEMORY = body.memory.toString(); //"3072"; // MB
    const VM_VCPUS = body.vcpu.toString(); //"2";
    const VM_DISK_SIZE = body.diskSizeGB > 20 ? `${body.diskSizeGB}G` : '20G'; // Size for the new VM disk based on the cloud image

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
        await this.executeCommand(`wget -O ${baseImagePath} ${OS_IMAGE_URL}`);
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
      await this.executeCommand(
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
        await this.executeCommand('command -v genisoimage');
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        console.log('[INFO] genisoimage not found, trying mkisofs.');
        try {
          await this.executeCommand('command -v mkisofs');
          isoCommand = 'mkisofs';
        } catch (e2) {
          console.error(
            '[ERROR] Neither genisoimage nor mkisofs found. Please install one of them.',
          );
          throw e2;
        }
      }

      await this.executeCommand(
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

      await this.executeCommand(virtInstallCommand);

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
      const instance = await this.getInstanceDetail(VM_NAME);
      return {
        status: true,
        instanceDetail: instance,
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
      const output = (await this.executeCommand('virsh list --all')) as string;
      const list = this.parseCMDResponse(output);
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

  async getInstanceDetail(vmName: string) {
    try {
      const output = (await this.executeCommand(
        `virsh dominfo ${vmName}`,
      )) as string;
      const output2 = (await this.executeCommand(
        `virsh domifaddr ${vmName}`,
      )) as string;
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
      const instanceAddr: { Address: string } = this.parseCMDResponse(
        output2,
      )[0] as { Address: string };
      return {
        status: true,
        instanceDetail: {
          ...vmInfo,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          instanceName: vmInfo.Name,
          ...instanceAddr,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          Address: instanceAddr.Address.split('/')[0],
        },
      };
    } catch (error) {
      return {
        status: true,
        instanceDetail: {},
        error: `VM "${vmName}" not found or details unavailable`,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        details: error,
      };
    }
  }

  async performInstanceAction(vmName: string, action: string) {
    try {
      const output = await this.executeCommand(`virsh ${action} ${vmName}`);
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
        message: `VM "${vmName}" ${message} successfully`,
        details: output,
      };
    } catch (error) {
      return {
        status: true,
        error: `Failed to start VM "${vmName}"`,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        details: error,
      };
    }
  }

  async deleteInstance(vmName: string) {
    try {
      await this.executeCommand(`virsh destroy ${vmName}`);
      await this.executeCommand(`virsh undefine ${vmName}`);
      const VM_IMAGE_BASE_PATH = '/var/lib/libvirt/images';
      const imageName = `${vmName}.qcow2`;
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

      return { status: true, message: `VM "${vmName}" deleted successfully.` };
    } catch (error) {
      return {
        status: false,
        error: `Failed to delete VM "${vmName}"`,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        details: error,
      };
    }
  }
}
