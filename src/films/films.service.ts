import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFilmDto, UpdateFilmDto, FilmFilterDto } from './dto';
import { CacheService } from '../cache/cache.service';
import { ViewCountService } from '../view-count/view-count.service';

@Injectable()
export class FilmsService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
    private viewCountService: ViewCountService,
  ) {}

  async create(createFilmDto: CreateFilmDto) {
    const { categories, actors, keywords, ...filmData } = createFilmDto;

    const film = await this.prisma.film.create({
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

    await this.cacheService.delete('films:home');
    await this.cacheService.delete('films:trending:7days');

    return film;
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
    const cacheKey = `film:${id}`;

    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const film = await this.prisma.film.findUnique({
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

    if (film) {
      await this.cacheService.set(cacheKey, film, 3600);
    }

    return film;
  }

  async findBySlug(slug: string) {
    const cacheKey = `film:slug:${slug}`;

    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const film = await this.prisma.film.findUnique({
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

    if (film) {
      await this.cacheService.set(cacheKey, film, 3600);
      if (film.id) {
        await this.cacheService.set(`film:${film.id}`, film, 3600);
      }
    }

    return film;
  }

  async update(id: number, updateFilmDto: UpdateFilmDto) {
    const { categories, actors, keywords, ...filmData } = updateFilmDto;

    const existingFilm = await this.prisma.film.findUnique({
      where: { id },
      select: { slug: true },
    });

    if (categories !== undefined) {
      await this.prisma.filmCategory.deleteMany({ where: { filmId: id } });
    }
    if (actors !== undefined) {
      await this.prisma.filmActor.deleteMany({ where: { filmId: id } });
    }
    if (keywords !== undefined) {
      await this.prisma.filmKeyword.deleteMany({ where: { filmId: id } });
    }

    const film = await this.prisma.film.update({
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

    await this.cacheService.delete(`film:${id}`);
    if (existingFilm?.slug) {
      await this.cacheService.delete(`film:slug:${existingFilm.slug}`);
    }
    if (film.slug && film.slug !== existingFilm?.slug) {
      await this.cacheService.delete(`film:slug:${film.slug}`);
    }

    await this.cacheService.delete('films:home');
    await this.cacheService.delete('films:trending:7days');

    return film;
  }

  async remove(id: number) {
    const film = await this.prisma.film.findUnique({
      where: { id },
      select: { slug: true },
    });

    const deletedFilm = await this.prisma.film.delete({
      where: { id },
    });

    await this.cacheService.delete(`film:${id}`);
    if (film?.slug) {
      await this.cacheService.delete(`film:slug:${film.slug}`);
    }
    await this.cacheService.delete('films:home');
    await this.cacheService.delete('films:trending:7days');

    return deletedFilm;
  }

  async incrementView(id: number) {
    return this.viewCountService.incrementView(id);
  }

  async getTrendingFilms() {
    const cacheKey = 'films:trending:7days';

    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

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

    const filmsMap = new Map(films.map((film) => [film.id, film]));
    const sortedFilms = filmIds
      .map((id) => filmsMap.get(id))
      .filter((film): film is NonNullable<typeof film> => film !== undefined)
      .sort((a, b) => {
        const viewsA = viewsMap.get(a.id) || 0;
        const viewsB = viewsMap.get(b.id) || 0;
        return viewsB - viewsA;
      });

    // cache 10 phút
    await this.cacheService.set(cacheKey, sortedFilms, 600);

    return sortedFilms;
  }

  async getHomeFilms() {
    const cacheKey = 'films:home';

    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

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

    const result = {
      featured,
      popular,
      latest,
      topRated,
      trendingSeries,
    };

    // cache 15 phút
    await this.cacheService.set(cacheKey, result, 900);

    return result;
  }
}
