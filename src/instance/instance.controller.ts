import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { InstanceService } from './instance.service';
import { CreateInstanceRequest } from './instance.interface';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { User } from 'src/user/user.entity';

@Controller('instance')
export class InstanceController {
  constructor(private instanceService: InstanceService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createInstance(@Body() body: CreateInstanceRequest, @Request() req) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.instanceService.createInstance(body, req.user as User);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getInstanceList() {
    return this.instanceService.getInstanceList();
  }

  @UseGuards(JwtAuthGuard)
  @Get('detail/:name')
  async getInstanceDetail(@Param() params: { name: string }) {
    return this.instanceService.getInstanceDetail(params.name);
  }

  @UseGuards(JwtAuthGuard)
  @Get('action/:name/:action')
  async performInstanceAction(
    @Param() params: { name: string; action: string },
  ) {
    return this.instanceService.performInstanceAction(
      params.name,
      params.action,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('delete/:name')
  async deleteInstance(@Param() params: { name: string }) {
    return this.instanceService.deleteInstance(params.name);
  }

  @UseGuards(JwtAuthGuard)
  @Get('volume/:name')
  async attachedVolumes(@Param() params: { name: string }) {
    return this.instanceService.attachedVolumes(params.name);
  }
}
