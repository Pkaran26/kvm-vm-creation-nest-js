import { exec } from 'child_process';
import { promisify } from 'util';
import { CreateVolumeActivity } from 'src/volume/volume.interface';

const execAsync = promisify(exec);

export async function createVolume(payload: CreateVolumeActivity) {
  const { name, storagePool, capacity } = payload;
  try {
    const output = await execAsync(
      `virsh vol-create-as --pool ${storagePool} --name ${name} --capacity ${capacity}G --format qcow2`,
      { timeout: 600000 },
    );

    return {
      status: true,
      detail: output,
    };
  } catch (error) {
    return {
      status: true,
      error: 'Failed to create volume',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      detail: error,
    };
  }
}
