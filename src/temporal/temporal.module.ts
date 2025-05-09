/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Module, Global } from '@nestjs/common';
import { WorkflowClient } from '@temporalio/client';
import { TemporalService } from './temporal.service';
import { WorkflowController } from './temporal.controller';

@Global()
@Module({
  providers: [
    {
      provide: WorkflowClient,
      useValue: new WorkflowClient(), // Defaults to localhost:7233
    },
    TemporalService,
  ],
  controllers: [WorkflowController],
  exports: [WorkflowClient, TemporalService],
})
export class TemporalModule {}
