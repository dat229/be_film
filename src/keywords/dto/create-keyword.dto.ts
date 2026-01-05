import { IsString } from 'class-validator';

export class CreateKeywordDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;
}
