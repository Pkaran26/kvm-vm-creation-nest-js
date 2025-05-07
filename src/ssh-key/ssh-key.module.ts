import { Module } from '@nestjs/common';
import { SshKeyController } from './ssh-key.controller';
import { SshKeyService } from './ssh-key.service';

@Module({
  controllers: [SshKeyController],
  providers: [SshKeyService],
})
export class SshKeyModule {}
