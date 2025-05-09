import { Worker } from '@temporalio/worker';
import * as activities from './activities/image.activity';

async function run() {
  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows/image.workflow'),
    activities,
    taskQueue: 'image-download-queue',
  });

  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
