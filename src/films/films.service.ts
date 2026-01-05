import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFilmDto, UpdateFilmDto, FilmFilterDto } from './dto';

@Injectable()
export class FilmsService {
  constructor(private prisma: PrismaService) {}

  async create(createFilmDto: CreateFilmDto) {
    const { categories, actors, keywords, ...filmData } = createFilmDto;

    return this.prisma.film.create({
      data: {
        ...filmData,
        categories: {
          create: categories?.map((id) => ({ categoryId: id })) || [],
        },
        actors: {
          create: actors?.map((id) => ({ actorId: id })) || [],
        },
        keywords: {
          create: keywords?.map((id) => ({ keywordId: id })) || [],
        },
      },
      include: {
        categories: { include: { category: true } },
        actors: { include: { actor: true } },
        keywords: { include: { keyword: true } },
      },
    });
  }

  async findAll(filters: FilmFilterDto) {
    const {
      page = 1,
      limit = 20,
      year,
      categoryId,
      countryId,
      genreId,
      actorId,
      keywordId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const skip = (page - 1) * limit;

    const where: any = {
      status: 'active',
    };

    if (year) {
      where.year = year;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { nameNormalized: { contains: search } },
      ];
    }

    if (categoryId && !countryId && !genreId) {
      where.categories = {
        some: { categoryId },
      };
    }

    const categoryFilters: any[] = [];
    if (countryId) {
      categoryFilters.push({ categoryId: countryId });
    }
    if (genreId) {
      categoryFilters.push({ categoryId: genreId });
    }

    if (categoryFilters.length > 0) {
      if (categoryFilters.length === 2) {
        where.AND = [
          {
            categories: {
              some: { categoryId: countryId },
            },
          },
          {
            categories: {
              some: { categoryId: genreId },
            },
          },
        ];
      } else {
        where.categories = {
          some: categoryFilters[0],
        };
      }
    }

    if (actorId) {
      where.actors = {
        some: { actorId },
      };
    }

    if (keywordId) {
      where.keywords = {
        some: { keywordId },
      };
    }

    const SORT_FIELDS = ['createdAt', 'updatedAt', 'year', 'rating'] as const;
    const safeSortBy = SORT_FIELDS.includes(sortBy as any)
      ? sortBy
      : 'createdAt';

    const [films, total] = await Promise.all([
      this.prisma.film.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [safeSortBy]: sortOrder === 'asc' ? 'asc' : 'desc',
        },
        include: {
          categories: { include: { category: true } },
          actors: { include: { actor: true } },
          keywords: { include: { keyword: true } },
        },
      }),
      this.prisma.film.count({ where }),
    ]);

    return {
      data: films,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    return this.prisma.film.findUnique({
      where: { id },
      include: {
        categories: { include: { category: true } },
        actors: { include: { actor: true } },
        keywords: { include: { keyword: true } },
        episodes: {
          where: { status: 'active' },
          orderBy: { episodeNumber: 'asc' },
        },
      },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.film.findUnique({
      where: { slug },
      include: {
        categories: { include: { category: true } },
        actors: { include: { actor: true } },
        keywords: { include: { keyword: true } },
        episodes: {
          where: { status: 'active' },
          orderBy: { episodeNumber: 'asc' },
        },
      },
    });
  }

  async update(id: number, updateFilmDto: UpdateFilmDto) {
    const { categories, actors, keywords, ...filmData } = updateFilmDto;

    // Xóa các quan hệ cũ nếu có
    if (categories !== undefined) {
      await this.prisma.filmCategory.deleteMany({ where: { filmId: id } });
    }
    if (actors !== undefined) {
      await this.prisma.filmActor.deleteMany({ where: { filmId: id } });
    }
    if (keywords !== undefined) {
      await this.prisma.filmKeyword.deleteMany({ where: { filmId: id } });
    }

    return this.prisma.film.update({
      where: { id },
      data: {
        ...filmData,
        ...(categories && {
          categories: {
            create: categories.map((catId) => ({ categoryId: catId })),
          },
        }),
        ...(actors && {
          actors: {
            create: actors.map((actId) => ({ actorId: actId })),
          },
        }),
        ...(keywords && {
          keywords: {
            create: keywords.map((keyId) => ({ keywordId: keyId })),
          },
        }),
      },
      include: {
        categories: { include: { category: true } },
        actors: { include: { actor: true } },
        keywords: { include: { keyword: true } },
      },
    });
  }

  async remove(id: number) {
    return this.prisma.film.delete({
      where: { id },
    });
  }

  async incrementView(id: number) {
    return this.prisma.film.update({
      where: { id },
      data: {
        viewCount: { increment: 1 },
      },
    });
  }

  async getHomeFilms() {
    const [featured, popular, latest, topRated] = await Promise.all([
      // Featured films (có thể là phim nổi bật)
      this.prisma.film.findMany({
        where: { status: 'active' },
        take: 10,
        orderBy: { viewCount: 'desc' },
        include: {
          categories: { include: { category: true } },
          actors: { include: { actor: true } },
        },
      }),
      // xem nhiều nhất
      this.prisma.film.findMany({
        where: { status: 'active' },
        take: 12,
        orderBy: { viewCount: 'desc' },
        include: {
          categories: { include: { category: true } },
        },
      }),
      // mới nhất
      this.prisma.film.findMany({
        where: { status: 'active' },
        take: 12,
        orderBy: { createdAt: 'desc' },
        include: {
          categories: { include: { category: true } },
        },
      }),
      // đánh giá cao
      this.prisma.film.findMany({
        where: { status: 'active', rating: { gte: 7 } },
        take: 12,
        orderBy: { rating: 'desc' },
        include: {
          categories: { include: { category: true } },
        },
      }),
    ]);

    return {
      featured,
      popular,
      latest,
      topRated,
    };
  }
}
