/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { WorkflowClient } from '@temporalio/client';

@Injectable()
export class TemporalService {
  constructor(private readonly temporalClient: WorkflowClient) {}

  async getWorkflowStatus(workflowId: string) {
    const handle = this.temporalClient.getHandle(workflowId);
    const description = await handle.describe();

    return {
      workflowId: description.workflowId,
      runId: description.runId,
      status: description.status, // e.g., RUNNING, COMPLETED
      startTime: description.startTime,
      closeTime: description.closeTime,
    };
  }
}
