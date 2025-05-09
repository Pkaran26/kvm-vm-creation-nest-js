import { Module, Global } from '@nestjs/common';
import { WorkflowClient } from '@temporalio/client';

@Global()
@Module({
  providers: [
    {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      provide: WorkflowClient,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      useValue: new WorkflowClient(), // Defaults to localhost:7233
    },
  ],
  exports: [WorkflowClient],
})
export class TemporalModule {}
