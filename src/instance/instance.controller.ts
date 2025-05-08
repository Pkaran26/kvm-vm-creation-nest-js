import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { InstanceService } from './instance.service';
import { CreateInstanceRequest } from './instance.interface';

@Controller('instance')
export class InstanceController {
  constructor(private instanceService: InstanceService) {}

  @Post()
  async createInstance(@Body() body: CreateInstanceRequest) {
    return this.instanceService.createInstance(body);
  }

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

  @Get('volume/:name')
  async attachedVolumes(@Param() params: { name: string }) {
    return this.instanceService.attachedVolumes(params.name);
  }
}
