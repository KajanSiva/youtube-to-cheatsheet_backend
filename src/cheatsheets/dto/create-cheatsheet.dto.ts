import { IsUUID, IsString } from 'class-validator';

export class CreateCheatsheetDto {
  @IsUUID()
  videoId: string;

  @IsString()
  comment: string;
}
