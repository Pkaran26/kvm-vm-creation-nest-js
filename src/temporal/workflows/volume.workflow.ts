import { proxyActivities } from '@temporalio/workflow';
import type * as activities from '../activities/volume.activities';
import { CreateVolumeActivity } from 'src/volume/volume.interface';

const { createVolume } = proxyActivities<typeof activities>({
  startToCloseTimeout: '15 minutes',
});

export async function createVolumeWorkflow(
  body: CreateVolumeActivity,
): Promise<{
  status: boolean;
  detail: { stdout: string; stderr: string };
  error?: any;
}> {
  return await createVolume(body);
}
