import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const ISO_DOWNLOAD_PATH = './vm_images/';

export async function downloadImage(
  url: string,
  filename: string,
): Promise<string> {
  const outputPath = join(ISO_DOWNLOAD_PATH, filename);
  const command = `wget -O "${outputPath}" "${url}"`;
  console.log(`Executing: ${command}`);
  await execAsync(command, { timeout: 600000 }); // 10 min timeout
  return outputPath;
}
