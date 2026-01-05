import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  IsArray,
} from 'class-validator';

export class CreateFilmDto {
  @IsString()
  title: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  poster?: string;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsOptional()
  @IsInt()
  year?: number;

  @IsOptional()
  @IsInt()
  duration?: number;

  @IsOptional()
  @IsNumber()
  rating?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  linkM3u8?: string;

  @IsOptional()
  @IsString()
  linkWebview?: string;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  categories?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  actors?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  keywords?: number[];
}
