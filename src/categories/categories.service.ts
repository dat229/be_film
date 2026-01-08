import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class CategoriesService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const category = await this.prisma.category.create({
      data: createCategoryDto,
    });

    await this.cacheService.deletePattern('categories:*');

    return category;
  }

  async findAll(type?: string) {
    const cacheKey = type ? `categories:${type}` : 'categories:all';

    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const where = type ? { type } : {};
    const categories = await this.prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    // cache 24 giờ
    await this.cacheService.set(cacheKey, categories, 86400);

    return categories;
  }

  findOne(id: number) {
    return this.prisma.category.findUnique({
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

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });

    await this.cacheService.deletePattern('categories:*');

    return category;
  }

  async remove(id: number) {
    const category = await this.prisma.category.delete({
      where: { id },
    });

    await this.cacheService.deletePattern('categories:*');

    return category;
  }
}
