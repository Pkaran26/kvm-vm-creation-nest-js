import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, writeFileSync, unlinkSync, mkdirSync } from 'fs';
import { join, basename } from 'path';
import { CreateInstanceRequestActivity } from 'src/instance/instance.interface';

const execAsync = promisify(exec);

export async function createInstance(
  body: CreateInstanceRequestActivity,
): Promise<{
  status: boolean;
  instanceName: string;
  message: string;
  error?: unknown;
}> {
  const VM_NAME = body.instanceName + '-' + Math.random().toString();
  const OS_IMAGE_URL = body.SELECTED_OS.url;
  const DOWNLOAD_DIR = './vm_images';
  const BASE_IMAGE_NAME = body.SELECTED_OS.filename;
  const VM_DISK_NAME = `${VM_NAME}.qcow2`;
  const CLOUD_INIT_ISO_NAME = `${VM_NAME}-cloud-init.iso`;

  const VM_MEMORY = (body.cpuPack.ram * 1024).toString();
  const VM_VCPUS = body.cpuPack.cpu.toString();
  const VM_DISK_SIZE = `${body.diskPack.diskSize}G`;

  const SSH_PUBLIC_KEY = body.ssh;
  const USERNAME = body.SELECTED_OS.username;
  const HOSTNAME = VM_NAME;
  const instantApps = body.instantApps;

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
      await execAsync(`wget -O ${baseImagePath} ${OS_IMAGE_URL}`, {
        timeout: 600000,
      });
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
    await execAsync(
      `qemu-img create -f qcow2 -b ${basename(
        baseImagePath,
      )} -F qcow2 ${vmDiskPath} ${VM_DISK_SIZE}`,
      { timeout: 600000 },
    );
    console.log('[INFO] Preparing cloud-init data...');
    let userDataContent = `\
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
package_update: true
package_upgrade: true
# packages:
#  - qemu-guest-agent
runcmd:
#  - [ systemctl, enable, qemu-guest-agent.service ]
#  - [ systemctl, start, --no-block, qemu-guest-agent.service ]
`;

    if (instantApps && instantApps.length > 0) {
      instantApps.map((e) => {
        if (e && body.SELECTED_OS.installCommands[e]) {
          body.SELECTED_OS.installCommands[e].map((c) => {
            userDataContent += `\n  - [ ${c} ]`;
          });
        }
      });
    }

    writeFileSync(userDataPath, userDataContent);

    const metaDataContent = `\
instance-id: ${VM_NAME}-instance-01
local-hostname: ${HOSTNAME}
`;
    writeFileSync(metaDataPath, metaDataContent);
    console.log(`Cloud-init user-data written to: ${userDataPath}`);
    console.log(`Cloud-init meta-data written to: ${metaDataPath}`);

    if (existsSync(cloudInitIsoPath)) {
      console.warn(
        `[WARN] Cloud-init ISO ${cloudInitIsoPath} already exists. Deleting and recreating.`,
      );
      unlinkSync(cloudInitIsoPath);
    }
    // Check for genisoimage, fallback to mkisofs
    let isoCommand = 'genisoimage';
    try {
      await execAsync('command -v genisoimage', { timeout: 600000 });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      console.log('[INFO] genisoimage not found, trying mkisofs.');
      try {
        await execAsync('command -v mkisofs', { timeout: 600000 });
        isoCommand = 'mkisofs';
      } catch (e2) {
        console.error(
          '[ERROR] Neither genisoimage nor mkisofs found. Please install one of them.',
        );
        throw e2;
      }
    }

    await execAsync(
      `${isoCommand} -output ${cloudInitIsoPath} -volid cidata -joliet -rock ${userDataPath} ${metaDataPath}`,
      { timeout: 600000 },
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
        --os-variant ${body.SELECTED_OS.variant} \\
        --virt-type kvm \\
        --graphics vnc,listen=0.0.0.0 \\
        --network network=${body.network},model=virtio \\
        --import \\
        --noautoconsole`;
    await execAsync(virtInstallCommand, { timeout: 600000 });
    return {
      status: true,
      instanceName: VM_NAME,
      message: 'Instance created successfully',
    };
  } catch (error) {
    console.log(error);
    return {
      status: false,
      instanceName: VM_NAME,
      message: 'Instance creation failed',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      error: error,
    };
  }
}

// export async createVMSubscription () {
//   const subscription = await this.subscriptionService.createSubscription({
//     name: 'Instance Subscription',
//     userId: 1,
//     totalAmount: cpuPack.monthlyPrice + diskPack.monthlyPrice,
//     status: 'active',
//     metaData: JSON.stringify({
//       vmName: VM_NAME,
//       cpuPack: cpuPack,
//       diskPack: diskPack,
//     }),
//   });
// }
