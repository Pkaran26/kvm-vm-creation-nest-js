import { proxyActivities } from '@temporalio/workflow';
import type * as activities from '../activities/instance.activities';
import { CreateInstanceRequestActivity } from 'src/instance/instance.interface';

const { createInstance } = proxyActivities<typeof activities>({
  startToCloseTimeout: '15 minutes',
});

export async function createInstanceWorkflow(
  body: CreateInstanceRequestActivity,
): Promise<{
  status: boolean;
  instanceName: string;
  message: string;
}> {
  return await createInstance(body);
}
