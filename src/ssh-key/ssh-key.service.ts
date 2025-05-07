import { Injectable } from '@nestjs/common';
import { utils } from 'ssh2';
import { existsSync, mkdirSync, writeFileSync, readdir } from 'fs';

@Injectable()
export class SshKeyService {
  private SSH_DIR = './ssh-keys';

  generateSSHKey(keyName: string) {
    return new Promise((resolve, reject) => {
      if (!existsSync(this.SSH_DIR)) {
        mkdirSync(this.SSH_DIR, { recursive: true });
        console.log(`Created directory: ${this.SSH_DIR}`);
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
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
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              detail: err,
            });
          }
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const { private: privateKey, public: publicKey } = keypair;
          writeFileSync(`${this.SSH_DIR}/${keyName}`, privateKey as string);
          writeFileSync(`${this.SSH_DIR}/${keyName}.pub`, publicKey as string);
          resolve({
            status: true,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            publicKey: publicKey,
          });
        },
      );
    });
  }

  listSSHKey() {
    return new Promise((resolve, reject) => {
      try {
        readdir(this.SSH_DIR, (err, files) => {
          console.log('files ', files);
          if (files) {
            resolve({ status: true, sshKeys: files });
          }
          resolve({ status: false, sshKeys: [] });
        });
      } catch (error) {
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        reject({
          status: false,
          sshKeys: [],
          error: 'Failed to list ssh keys',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          details: error,
        });
      }
    });
  }
}
