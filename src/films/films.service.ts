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
      type,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      status: 'active',
    };

    if (type) {
      where.type = type;
    }

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
        select: {
          id: true,
          title: true,
          slug: true,
          poster: true,
          thumbnail: true,
          year: true,
          duration: true,
          rating: true,
          viewCount: true,
          type: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          categories: {
            select: {
              category: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  slug: true,
                },
              },
            },
          },
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.$transaction(async (tx) => {
      await tx.film.update({
        where: { id },
        data: {
          viewCount: { increment: 1 },
        },
      });

      await tx.filmDailyView.upsert({
        where: {
          filmId_date: {
            filmId: id,
            date: today,
          },
        },
        update: {
          viewCount: { increment: 1 },
        },
        create: {
          filmId: id,
          date: today,
          viewCount: 1,
        },
      });

      return { success: true };
    });
  }

  async getTrendingFilms() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const formatDateForMySQL = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const trendingFilmsData = await this.prisma.$queryRaw<
      Array<{ filmId: number; totalViews: bigint }>
    >`
      SELECT 
        fdv.filmId,
        SUM(fdv.viewCount) as totalViews
      FROM film_daily_views fdv
      WHERE DATE(fdv.date) >= DATE(${formatDateForMySQL(sevenDaysAgo)})
        AND DATE(fdv.date) <= DATE(${formatDateForMySQL(today)})
      GROUP BY fdv.filmId
      ORDER BY totalViews DESC
      LIMIT 12
    `;
    if (trendingFilmsData.length === 0) {
      return [];
    }

    const viewsMap = new Map(
      trendingFilmsData.map((item) => [item.filmId, Number(item.totalViews)]),
    );

    const filmIds = trendingFilmsData.map((item) => item.filmId);

    const films = await this.prisma.film.findMany({
      where: {
        id: { in: filmIds },
        status: 'active',
      },
      select: {
        id: true,
        title: true,
        slug: true,
        poster: true,
        thumbnail: true,
        year: true,
        duration: true,
        rating: true,
        viewCount: true,
        type: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        categories: {
          select: {
            category: {
              select: {
                id: true,
                name: true,
                type: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    // Sắp xếp lại films theo thứ tự totalViews từ cao xuống thấp
    const filmsMap = new Map(films.map((film) => [film.id, film]));
    const sortedFilms = filmIds
      .map((id) => filmsMap.get(id))
      .filter((film): film is NonNullable<typeof film> => film !== undefined)
      .sort((a, b) => {
        const viewsA = viewsMap.get(a.id) || 0;
        const viewsB = viewsMap.get(b.id) || 0;
        return viewsB - viewsA;
      });

    return sortedFilms;
  }

  async getHomeFilms() {
    const listSelect = {
      id: true,
      title: true,
      slug: true,
      poster: true,
      thumbnail: true,
      year: true,
      duration: true,
      rating: true,
      viewCount: true,
      type: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      categories: {
        select: {
          category: {
            select: {
              id: true,
              name: true,
              type: true,
              slug: true,
            },
          },
        },
      },
    };

    const [featured, popular, latest, topRated, trendingSeries] =
      await Promise.all([
        // phim nổi bật
        this.prisma.film.findMany({
          where: { status: 'active' },
          take: 10,
          orderBy: { viewCount: 'desc' },
          select: listSelect,
        }),
        // xem nhiều nhất
        this.prisma.film.findMany({
          where: { status: 'active' },
          take: 12,
          orderBy: { viewCount: 'desc' },
          select: listSelect,
        }),
        // mới nhất
        this.prisma.film.findMany({
          where: { status: 'active' },
          take: 12,
          orderBy: { createdAt: 'desc' },
          select: listSelect,
        }),
        // đánh giá cao
        this.prisma.film.findMany({
          where: { status: 'active', rating: { gte: 7 } },
          take: 12,
          orderBy: { rating: 'desc' },
          select: listSelect,
        }),
        // Phim thịnh hành (7 ngày gần nhất) - tính từ FilmDailyView
        this.getTrendingFilms(),
      ]);

    return {
      featured,
      popular,
      latest,
      topRated,
      trendingSeries,
    };
  }
}
