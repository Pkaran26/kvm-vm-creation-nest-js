import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

@Injectable()
export class InstanceService {
  executeCommand(command: string, timeout: any = undefined) {
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
  writeFile(path: string, content: string) {
    return new Promise((resolve, reject) => {
      fs.writeFile(path, content, (err) => {
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        if (err) return reject(false);
        resolve(true);
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
      const vmInfo = {};
      lines.forEach((line) => {
        const [key, value] = line.split(':').map((item) => item.trim());
        vmInfo[key] = value;
      });
      return {
        status: true,
        instanceDetail: { ...vmInfo, ...this.parseCMDResponse(output2)[0] },
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
      const VM_IMAGE_BASE_PATH = '/var/lib/libvirt/images';
      const imageName = `${vmName}.qcow2`;
      const diskPath = path.join(VM_IMAGE_BASE_PATH, imageName);

      try {
        fs.unlink(diskPath, (err) => {
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
