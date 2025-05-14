import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { NetworkService } from './network.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';

@Controller('network')
export class NetworkController {
  constructor(private networkService: NetworkService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getNetworkList() {
    return this.networkService.getNetworkList();
  }

  @UseGuards(JwtAuthGuard)
  @Post(':name')
  async createNetwork(@Param() params: { name: string }) {
    return this.networkService.createNetwork(params.name);
  }
}
