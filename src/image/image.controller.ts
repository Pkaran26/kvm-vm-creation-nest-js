import { Controller, Get, Param } from '@nestjs/common';
import { ImageService } from './image.service';

@Controller('image')
export class ImageController {
  constructor(private imageService: ImageService) {}

  @Get()
  getInstanceImageList() {
    return this.imageService.getInstanceImageList();
  }

  @Get('download/:osName')
  downloadImage(@Param() params: { osName: string }) {
    return this.imageService.downloadImage(params.osName);
  }
}
