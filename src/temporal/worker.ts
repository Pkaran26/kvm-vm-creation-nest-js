import { Worker } from '@temporalio/worker';
import * as imageActivities from './activities/image.activity';
import * as instanceActivities from './activities/instance.activities';
import * as volumeActivities from './activities/volume.activities';

interface WorkerPayload {
  workflowsPath: any;
  activities: any;
  taskQueue: string;
}

async function createAndRunWorker(payload: WorkerPayload) {
  const worker = await Worker.create(payload);
  await worker.run();
}

createAndRunWorker({
  workflowsPath: require.resolve('./workflows/image.workflow'),
  activities: imageActivities,
  taskQueue: 'image-download-queue',
}).catch((err) => {
  console.error(err);
  process.exit(1);
});

createAndRunWorker({
  workflowsPath: require.resolve('./workflows/instance.workflow'),
  activities: instanceActivities,
  taskQueue: 'instance-queue',
}).catch((err) => {
  console.error(err);
  process.exit(1);
});

createAndRunWorker({
  workflowsPath: require.resolve('./workflows/volume.workflow'),
  activities: volumeActivities,
  taskQueue: 'volume-queue',
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
