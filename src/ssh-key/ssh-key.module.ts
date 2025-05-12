import { Module } from '@nestjs/common';
import { SshKeyController } from './ssh-key.controller';
import { SshKeyService } from './ssh-key.service';
import { SSHKey } from './ssh-key.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([SSHKey])],
  controllers: [SshKeyController],
  providers: [SshKeyService],
})
export class SshKeyModule {}
