/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// ✅ workflows/image.workflow.ts
import { proxyActivities } from '@temporalio/workflow';
import type * as activities from '../activities/image.activity';

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
const { downloadImage } = proxyActivities<typeof activities>({
  startToCloseTimeout: '15 minutes',
});

export async function downloadImageWorkflow(url: string, filename: string) {
  console.log('url work', url, filename);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  await downloadImage(url, filename);
}
