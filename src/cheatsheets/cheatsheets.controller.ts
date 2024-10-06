import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpException,
  Get,
  Param,
  NotFoundException,
  Query,
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

  @Get(':id')
  async getCheatsheet(@Param('id') id: string) {
    try {
      const cheatsheet = await this.cheatsheetsService.getCheatsheetById(id);
      return {
        id: cheatsheet.id,
        videoId: cheatsheet.video.id,
        processingStatus: cheatsheet.processingStatus,
        neededTopics: cheatsheet.neededTopics,
        content: cheatsheet.content,
        language: cheatsheet.language,
        createdAt: cheatsheet.createdAt,
        updatedAt: cheatsheet.updatedAt,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  async getCheatsheets(@Query('videoId') videoId?: string) {
    try {
      const cheatsheets = await this.cheatsheetsService.getCheatsheets(videoId);
      return cheatsheets.map((cheatsheet) => ({
        id: cheatsheet.id,
        videoId: cheatsheet.video.id,
        processingStatus: cheatsheet.processingStatus,
        neededTopics: cheatsheet.neededTopics,
        language: cheatsheet.language,
        createdAt: cheatsheet.createdAt,
        updatedAt: cheatsheet.updatedAt,
      }));
    } catch (error) {
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
