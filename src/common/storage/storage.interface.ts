import { Injectable } from '@nestjs/common';

@Injectable()
export abstract class StorageService {
  abstract saveFile(fileName: string, fileContent: Buffer): Promise<string>;
  abstract readFile(filePath: string): Promise<Buffer>;
  abstract deleteFile(filePath: string): Promise<void>;
}
