import { Controller, Get, Param, Post } from '@nestjs/common';
import { NetworkService } from './network.service';

@Controller('network')
export class NetworkController {
  constructor(private networkService: NetworkService) {}

  @Get()
  async getNetworkList() {
    return this.networkService.getNetworkList();
  }

  @Post(':name')
  async createNetwork(@Param() params: { name: string }) {
    return this.networkService.createNetwork(params.name);
  }
}
