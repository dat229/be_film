import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActorDto, UpdateActorDto } from './dto';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class ActorsService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  async create(createActorDto: CreateActorDto) {
    const actor = await this.prisma.actor.create({
      data: createActorDto,
    });

    await this.cacheService.delete('actors:all');

    return actor;
  }

  async findAll() {
    const cacheKey = 'actors:all';

    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const actors = await this.prisma.actor.findMany({
      orderBy: { name: 'asc' },
    });

    // cache 24 giờ
    await this.cacheService.set(cacheKey, actors, 86400);

    return actors;
  }

  findOne(id: number) {
    return this.prisma.actor.findUnique({
      where: { id },
      include: {
        films: {
          include: {
            film: {
              include: {
                categories: { include: { category: true } },
                actors: { include: { actor: true } },
              },
            },
          },
        },
      },
    });
  }

  async update(id: number, updateActorDto: UpdateActorDto) {
    const actor = await this.prisma.actor.update({
      where: { id },
      data: updateActorDto,
    });

    await this.cacheService.delete('actors:all');

    return actor;
  }

  async remove(id: number) {
    const actor = await this.prisma.actor.delete({
      where: { id },
    });

    await this.cacheService.delete('actors:all');

    return actor;
  }
}
