import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { StorageService } from './storage.interface';

@Injectable()
export class LocalStorageService implements StorageService, OnModuleInit {
  private readonly localStoragePath: string = './storage';

  constructor() {}

  async onModuleInit() {
    await this.ensureStorageDirectoryExists();
  }

  private async ensureStorageDirectoryExists(): Promise<void> {
    try {
      await fs.promises.access(this.localStoragePath);
    } catch (error) {
      await fs.promises.mkdir(this.localStoragePath, { recursive: true });
    }
  }

  async saveFile(fileName: string, fileContent: Buffer): Promise<string> {
    await this.ensureStorageDirectoryExists();
    const filePath = path.join(this.localStoragePath, fileName);
    await fs.promises.writeFile(filePath, fileContent);
    return filePath;
  }

  async readFile(filePath: string): Promise<Buffer> {
    return fs.promises.readFile(filePath);
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.promises.access(filePath);
      await fs.promises.unlink(filePath);
    } catch (error) {
      // If the file doesn't exist, we can consider the deletion successful
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }
}
