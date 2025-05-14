import { Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { SshKeyService } from './ssh-key.service';
import { SSHKeyResponse } from './ssh-key.dto';

@Controller('ssh-key')
export class SshKeyController {
  constructor(private sshKeyService: SshKeyService) {}

  @Post(':name')
  async generateSSHKey(@Param() param: { name: string }) {
    const sshKey: SSHKeyResponse = await this.sshKeyService.generateSSHKey(
      param.name,
    );
    if (sshKey.status) {
      await this.sshKeyService.createSSHKey({
        userId: 1,
        name: param.name,
        privateKey: sshKey.privateKey,
        publicKey: sshKey.publicKey,
      });
    }
    return {
      status: true,
      publicKey: sshKey.publicKey,
    };
  }

  @Get(':userId')
  listSSHKey(@Param('userId', ParseIntPipe) userId: number) {
    return this.sshKeyService.getAllSSHKey(userId);
  }
}
