import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { SettingsRepository } from './settings.repository';

@Module({
  imports: [
    MulterModule.register({}),
  ],
  controllers: [SettingsController],
  providers: [SettingsService, SettingsRepository],
})
export class SettingsModule {}
