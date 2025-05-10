import { proxyActivities } from '@temporalio/workflow';
import type * as activities from '../activities/image.activity';

const { downloadImage } = proxyActivities<typeof activities>({
  startToCloseTimeout: '15 minutes',
});

export async function downloadImageWorkflow(url: string, filename: string) {
  await downloadImage(url, filename);
}
