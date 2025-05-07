import { Injectable } from '@nestjs/common';
import { osDownloadMap } from 'src/os-mapping';
import { readdir } from 'fs';
// import { join } from 'path';
import { exec } from 'child_process';
const ISO_DOWNLOAD_PATH = './vm_images';

@Injectable()
export class ImageService {
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

  getInstanceImageList() {
    return new Promise((resolve, reject) => {
      try {
        readdir(ISO_DOWNLOAD_PATH, (err, files) => {
          console.log('files ', files);
          if (files) {
            const imageList: { name: string; downloaded: boolean }[] =
              Object.keys(osDownloadMap).map((key) => {
                return {
                  name: osDownloadMap[key as keyof typeof osDownloadMap]
                    .formalName,
                  downloaded: files.includes(
                    osDownloadMap[key as keyof typeof osDownloadMap].filename,
                  ),
                };
              });
            resolve({ status: true, imageList: imageList });
          }
          resolve({ status: false, imageList: [] });
        });
      } catch (error) {
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        reject({
          status: false,
          imageList: [],
          error: 'Failed to list ISOs',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          details: error,
        });
      }
    });
  }

  // Function to download an ISO image using wget
  // const downloadISO = async (url, filename) => {
  //   console.log("url ", url);

  //   const outputPath = join(ISO_DOWNLOAD_PATH, filename);
  //   const command = `wget -O "${outputPath}" "${url}"`;
  //   console.log("command ", command);

  //   console.log(`Downloading ${filename} from ${url} to ${outputPath}`);
  //   try {
  //     await this.executeCommand(command, 600000); // 5 minutes timeout
  //     console.log(`Successfully downloaded ${filename}`);
  //     return outputPath;
  //   } catch (error) {
  //     console.error(`Error downloading ${filename}: ${error}`);
  //   }
  // };

  // // POST /api/download/:osName - Download ISO based on OS name parameter
  // router.get("/api/download/:osName", async (req, res) => {
  //   const osName = req.params.osName.toLowerCase(); // Convert to lowercase for case-insensitive matching

  //   if (!osDownloadMap[osName]) {
  //     return res.status(400).json({
  //       error: `Unsupported OS name: ${osName}. Available options: ${Object.keys(
  //         osDownloadMap
  //       ).join(", ")}`,
  //     });
  //   }

  //   const { url, filename } = osDownloadMap[osName];

  //   downloadISO(url, filename).catch((error) => {
  //     console.error("Download failed:", error);
  //   });
  //   res.json({
  //     message: `${osName} ISO downloading started. It will appear on the list once downloaded`,
  //   });
  // });
}
