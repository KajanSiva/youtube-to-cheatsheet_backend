import { IsUUID, IsArray, IsString, ArrayMinSize } from 'class-validator';

export class CreateCheatsheetDto {
  @IsUUID()
  videoId: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  neededTopics: string[];

  @IsString()
  language: string;
}
