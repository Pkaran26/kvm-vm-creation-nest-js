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
import { VolumeModule } from './volume/volume.module';
import { StoragePoolService } from './storage-pool/storage-pool.service';
import { StoragePoolModule } from './storage-pool/storage-pool.module';
import { HelperService } from './helper/helper.service';
import { InvoiceModule } from './invoice/invoice.module';
import { TemporalModule } from './temporal/temporal.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Loads .env file and makes config global
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
    VolumeModule,
    StoragePoolModule,
    InvoiceModule,
    TemporalModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService, StoragePoolService, HelperService],
})
export class AppModule {}
