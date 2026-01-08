import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateKeywordDto, UpdateKeywordDto } from './dto';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class KeywordsService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  async create(createKeywordDto: CreateKeywordDto) {
    const keyword = await this.prisma.keyword.create({
      data: createKeywordDto,
    });

    await this.cacheService.delete('keywords:all');

    return keyword;
  }

  async findAll() {
    const cacheKey = 'keywords:all';

    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const keywords = await this.prisma.keyword.findMany({
      orderBy: { name: 'asc' },
    });

    // cache 24 giờ
    await this.cacheService.set(cacheKey, keywords, 86400);

    return keywords;
  }

  findOne(id: number) {
    return this.prisma.keyword.findUnique({
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

  async update(id: number, updateKeywordDto: UpdateKeywordDto) {
    const keyword = await this.prisma.keyword.update({
      where: { id },
      data: updateKeywordDto,
    });

    await this.cacheService.delete('keywords:all');

    return keyword;
  }

  async remove(id: number) {
    const keyword = await this.prisma.keyword.delete({
      where: { id },
    });

    await this.cacheService.delete('keywords:all');

    return keyword;
  }
}
