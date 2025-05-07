import { Controller, Get } from '@nestjs/common';
import { ImageService } from './image.service';

@Controller('image')
export class ImageController {
  constructor(private imageService: ImageService) {}

  @Get()
  getInstanceImageList() {
    return this.imageService.getInstanceImageList();
  }
}
