import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';

@Injectable()
export class HelperService {
  executeCommand(command: string, timeout: number = 30000) {
    return new Promise((resolve, reject) => {
      exec(command, { timeout }, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing command: ${command}`);
          console.error(stderr);
          // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
          reject(stderr);
          return;
        }
        resolve(stdout.trim());
      });
    });
  }

  parseCMDResponse(text: string) {
    const lines = text.trim().split('\n');
    const header = lines[0].split(/\s{2,}/).map((s) => s.trim()); // Split by 2+ spaces and trim
    const dataLines = lines.slice(2); // Skip header and separator

    return dataLines.map((line) => {
      const values = line.split(/\s{2,}/).map((v) => v.trim()); // Split by 2+ spaces and trim
      const obj = {};
      header.forEach((key, index) => {
        obj[key] = values[index];
      });
      return obj;
    });
  }
}
