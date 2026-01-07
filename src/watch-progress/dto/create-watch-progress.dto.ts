import {
  IsString,
  IsInt,
  IsNumber,
  IsBoolean,
  IsOptional,
} from 'class-validator';

export class CreateWatchProgressDto {
  @IsString()
  deviceId: string;

  @IsInt()
  filmId: number;

  @IsInt()
  @IsOptional()
  episodeId?: number;

  @IsNumber()
  currentTime: number;

  @IsNumber()
  duration: number;

  @IsBoolean()
  @IsOptional()
  completed?: boolean;
}
