import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { FilmsService } from './films.service';
import { CreateFilmDto, UpdateFilmDto, FilmFilterDto } from './dto';

@Controller('films')
export class FilmsController {
  constructor(private readonly filmsService: FilmsService) {}

  @Post()
  create(@Body() createFilmDto: CreateFilmDto) {
    return this.filmsService.create(createFilmDto);
  }

  @Get()
  findAll(@Query() filters: FilmFilterDto) {
    return this.filmsService.findAll(filters);
  }

  @Get('home')
  getHome() {
    return this.filmsService.getHomeFilms();
  }

  @Get('search')
  search(@Query('q') query: string, @Query() filters: FilmFilterDto) {
    return this.filmsService.findAll({ ...filters, search: query });
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.filmsService.findBySlug(slug);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.filmsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFilmDto: UpdateFilmDto,
  ) {
    return this.filmsService.update(id, updateFilmDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.filmsService.remove(id);
  }

  @Post(':id/view')
  incrementView(@Param('id', ParseIntPipe) id: number) {
    return this.filmsService.incrementView(id);
  }
}
