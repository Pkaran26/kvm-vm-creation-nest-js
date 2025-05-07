import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstanceModule } from './instance/instance.module';
import { UserModule } from './user/user.module';
import { InstancePackModule } from './instance-pack/instance-pack.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { ImageModule } from './image/image.module';
import { NetworkModule } from './network/network.module';
import { SshKeyModule } from './ssh-key/ssh-key.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'clouddb.db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
    InstanceModule,
    UserModule,
    InstancePackModule,
    SubscriptionModule,
    ImageModule,
    NetworkModule,
    SshKeyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
