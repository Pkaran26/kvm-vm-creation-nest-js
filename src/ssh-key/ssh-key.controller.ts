import { Controller, Get, Param } from '@nestjs/common';
import { SshKeyService } from './ssh-key.service';

@Controller('ssh-key')
export class SshKeyController {
  constructor(private sshKeyService: SshKeyService) {}

  @Get(':name')
  generateSSHKey(@Param() param: { name: string }) {
    return this.sshKeyService.generateSSHKey(param.name);
  }

  @Get()
  listSSHKey() {
    return this.sshKeyService.listSSHKey();
  }
}
