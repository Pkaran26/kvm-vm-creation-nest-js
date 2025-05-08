import { Module } from '@nestjs/common';
import { ImageService } from './image.service';
import { ImageController } from './image.controller';
import { HelperService } from 'src/helper/helper.service';

@Module({
  providers: [ImageService, HelperService],
  controllers: [ImageController],
})
export class ImageModule {}
