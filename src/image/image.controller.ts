import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ImageService } from './image.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';

@Controller('image')
export class ImageController {
  constructor(private imageService: ImageService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  getInstanceImageList() {
    return this.imageService.getInstanceImageList();
  }

  @UseGuards(JwtAuthGuard)
  @Get('download/:osName')
  downloadImage(@Param() params: { osName: string }) {
    return this.imageService.downloadImage(params.osName);
  }
}
