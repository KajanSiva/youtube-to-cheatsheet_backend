import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { CreateCheatsheetDto } from './dto/create-cheatsheet.dto';
import { CheatsheetsService } from './cheatsheets.service';

@Controller('cheatsheets')
export class CheatsheetsController {
  constructor(private readonly cheatsheetsService: CheatsheetsService) {}

  @Post()
  async createCheatsheet(@Body() createCheatsheetDto: CreateCheatsheetDto) {
    try {
      const result =
        await this.cheatsheetsService.createCheatsheet(createCheatsheetDto);
      return { message: 'Cheatsheet created successfully', id: result.id };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
