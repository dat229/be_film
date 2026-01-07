import { PartialType } from '@nestjs/mapped-types';
import { CreateWatchProgressDto } from './create-watch-progress.dto';

export class UpdateWatchProgressDto extends PartialType(
  CreateWatchProgressDto,
) {}
