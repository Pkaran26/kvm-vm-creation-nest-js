import { Injectable } from '@nestjs/common';
import { osDownloadMap } from 'src/os-mapping';
import { readdir } from 'fs';
import { join } from 'path';
import { HelperService } from 'src/helper/helper.service';
const ISO_DOWNLOAD_PATH = './vm_images';

@Injectable()
export class ImageService {
  constructor(private helperService: HelperService) {}

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

  async downloadFunc(url: string, filename: string) {
    const outputPath = join(ISO_DOWNLOAD_PATH, filename);
    const command = `wget -O "${outputPath}" "${url}"`;
    console.log(`Downloading ${filename} from ${url} to ${outputPath}`);
    try {
      await this.helperService.executeCommand(command, 600000); // 5 minutes timeout
      console.log(`Successfully downloaded ${filename}`);
      return outputPath;
    } catch (error) {
      console.error(`Error downloading ${filename}: ${error}`);
    }
  }

  downloadImage(osName: string) {
    if (!osDownloadMap[osName]) {
      return {
        status: false,
        error: `Unsupported OS name: ${osName}. Available options: ${Object.keys(
          osDownloadMap,
        ).join(', ')}`,
      };
    }

    const { url, filename } =
      osDownloadMap[osName as keyof typeof osDownloadMap];
    this.downloadFunc(url, filename).catch((error) => {
      console.error('Download failed:', error);
    });
    return {
      status: true,
      message: `${osName} ISO downloading started. It will appear on the list once downloaded`,
    };
  }
}
