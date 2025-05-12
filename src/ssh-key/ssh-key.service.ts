import { Injectable } from '@nestjs/common';
import { utils } from 'ssh2';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { InjectRepository } from '@nestjs/typeorm';
import { SSHKey } from './ssh-key.entity';
import { Repository } from 'typeorm';
import { SSHKeyResponse } from './ssh-key.dto';

@Injectable()
export class SshKeyService {
  private SSH_DIR = './ssh-keys';
  constructor(
    @InjectRepository(SSHKey)
    private readonly sshKeyRepository: Repository<SSHKey>,
  ) {}

  async createSSHKey(payload: Partial<SSHKey>): Promise<SSHKey> {
    const pack = this.sshKeyRepository.create(payload);
    return this.sshKeyRepository.save(pack);
  }

  async getAllSSHKey(userId: number): Promise<SSHKey[]> {
    return this.sshKeyRepository.find({
      where: { userId: userId },
    });
  }

  async getSSHKeyByName(userId: number, name: string): Promise<SSHKey[]> {
    return this.sshKeyRepository.find({
      where: { userId: userId, name: name },
    });
  }

  async generateSSHKey(keyName: string): Promise<SSHKeyResponse> {
    return new Promise((resolve, reject) => {
      if (!existsSync(this.SSH_DIR)) {
        mkdirSync(this.SSH_DIR, { recursive: true });
        console.log(`Created directory: ${this.SSH_DIR}`);
      }

      utils.generateKeyPair(
        'rsa',
        {
          bits: 2048,
          passphrase: 'your_passphrase',
          cipher: 'aes256-cbc',
        },
        (err, keypair) => {
          if (err) {
            console.error('Error generating key pair:', err);
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            return reject({
              status: false,

              detail: err,
            });
          }

          const { private: privateKey, public: publicKey } = keypair;
          writeFileSync(`${this.SSH_DIR}/${keyName}`, privateKey);
          writeFileSync(`${this.SSH_DIR}/${keyName}.pub`, publicKey);
          resolve({
            status: true,
            privateKey: privateKey,
            publicKey: publicKey,
          });
        },
      );
    });
  }
}
