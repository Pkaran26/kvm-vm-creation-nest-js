import { Controller, Get, Param } from '@nestjs/common';
import { TemporalService } from './temporal.service';
import { WorkflowExecutionStatusName } from '@temporalio/client/lib/types';
import * as proto from '@temporalio/proto';

@Controller('workflow')
export class WorkflowController {
  constructor(private readonly temporalService: TemporalService) {}

  @Get(':workflowId')
  getWorkflowStatus(@Param() params: { workflowId: string }): Promise<{
    workflowId: string;
    runId: string;
    status: {
      code: proto.temporal.api.enums.v1.WorkflowExecutionStatus;
      name: WorkflowExecutionStatusName;
    };
    startTime: Date;
    closeTime: Date | undefined;
  }> {
    return this.temporalService.getWorkflowStatus(params.workflowId);
  }
}
