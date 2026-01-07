import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { WatchProgressService } from './watch-progress.service';
import { CreateWatchProgressDto } from './dto';

@Controller('watch-progress')
export class WatchProgressController {
  constructor(private readonly watchProgressService: WatchProgressService) {}

  @Post()
  upsert(@Body() createWatchProgressDto: CreateWatchProgressDto) {
    return this.watchProgressService.upsert(createWatchProgressDto);
  }

  @Get('device/:deviceId/film/:filmId')
  findByDeviceAndFilm(
    @Param('deviceId') deviceId: string,
    @Param('filmId', ParseIntPipe) filmId: number,
  ) {
    return this.watchProgressService.findByDeviceAndFilm(deviceId, filmId);
  }

  @Get('device/:deviceId/film/:filmId/episode/:episodeId')
  findByDeviceFilmAndEpisode(
    @Param('deviceId') deviceId: string,
    @Param('filmId', ParseIntPipe) filmId: number,
    @Param('episodeId', ParseIntPipe) episodeId: number,
  ) {
    return this.watchProgressService.findByDeviceFilmAndEpisode(
      deviceId,
      filmId,
      episodeId,
    );
  }

  @Get('device/:deviceId/recent')
  getRecentWatching(
    @Param('deviceId') deviceId: string,
    @Query('limit') limit?: string,
  ) {
    return this.watchProgressService.getRecentWatching(
      deviceId,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Delete('device/:deviceId/film/:filmId')
  remove(
    @Param('deviceId') deviceId: string,
    @Param('filmId', ParseIntPipe) filmId: number,
    @Query('episodeId') episodeId?: string,
  ) {
    return this.watchProgressService.remove(
      deviceId,
      filmId,
      episodeId ? parseInt(episodeId, 10) : undefined,
    );
  }
}
