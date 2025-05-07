import { Controller, Get } from '@nestjs/common';
import { InstanceService } from './instance.service';

@Controller('instance')
export class InstanceController {
  constructor(private instanceService: InstanceService) {}

  @Get()
  async getInstanceList() {
    return this.instanceService.getInstanceList();
  }
}
