import { Controller, Get, Param } from '@nestjs/common';
import { InstanceService } from './instance.service';

@Controller('instance')
export class InstanceController {
  constructor(private instanceService: InstanceService) {}

  @Get()
  async getInstanceList() {
    return this.instanceService.getInstanceList();
  }

  @Get('detail/:name')
  async getInstanceDetail(@Param() params: { name: string }) {
    return this.instanceService.getInstanceDetail(params.name);
  }

  @Get('action/:name/:action')
  async performInstanceAction(
    @Param() params: { name: string; action: string },
  ) {
    return this.instanceService.performInstanceAction(
      params.name,
      params.action,
    );
  }

  @Get('delete/:name')
  async deleteInstance(@Param() params: { name: string }) {
    return this.instanceService.deleteInstance(params.name);
  }
}
