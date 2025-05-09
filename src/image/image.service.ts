import { Injectable } from '@nestjs/common';
import { readdir } from 'fs/promises';
import { osDownloadMap } from 'src/os-mapping';
import { WorkflowClient } from '@temporalio/client';

const ISO_DOWNLOAD_PATH = './vm_images';

@Injectable()
export class ImageService {
  constructor(private readonly temporalClient: WorkflowClient) {}

  async getInstanceImageList() {
    try {
      const files = await readdir(ISO_DOWNLOAD_PATH);
      const imageList = Object.keys(osDownloadMap).map((key) => {
        const mapItem = osDownloadMap[key as keyof typeof osDownloadMap];
        return {
          name: mapItem.formalName,
          downloaded: files.includes(mapItem.filename),
        };
      });
      return { status: true, imageList };
    } catch (error) {
      return {
        status: false,
        imageList: [],
        error: 'Failed to list ISOs',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        details: error,
      };
    }
  }

  async downloadImage(osName: string) {
    if (!osDownloadMap[osName]) {
      return {
        status: false,
        error: `Unsupported OS name: ${osName}. Available: ${Object.keys(osDownloadMap).join(', ')}`,
      };
    }

    const { url, filename } =
      osDownloadMap[osName as keyof typeof osDownloadMap];
    console.log('url ser', url, filename);
    // Start Temporal workflow
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    await this.temporalClient.start('downloadImageWorkflow', {
      args: [url, filename],
      taskQueue: 'image-download-queue',
      workflowId: `download-${osName}-${Date.now()}`,
    });

    return {
      status: true,
      message: `${osName} ISO download started. It will appear on the list once downloaded.`,
    };
  }
}
