import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.interface';
import { LocalStorageService } from './local-storage.service';

export const StorageServiceProvider: Provider = {
  provide: StorageService,
  useFactory: (configService: ConfigService) => {
    const storageType = configService.get('STORAGE_TYPE', 'local');
    switch (storageType) {
      case 'local':
        return new LocalStorageService();
      default:
        throw new Error(`Unsupported storage type: ${storageType}`);
    }
  },
  inject: [ConfigService],
};
