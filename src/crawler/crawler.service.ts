import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { CreateSlug } from 'utils/util';

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);

  constructor(private prisma: PrismaService) {}

  // lưu category
  async crawlAndSaveCategory(
    name: string,
    type: 'genre' | 'country',
    description?: string,
  ) {
    const slug = CreateSlug(name);
    try {
      const category = await this.prisma.category.upsert({
        where: { slug },
        update: { name, description, type },
        create: { name, slug, description, type },
      });
      return category;
    } catch (error) {
      this.logger.error(`Error saving category ${name}:`, error);
      throw error;
    }
  }

  // lưu actor
  async crawlAndSaveActor(name: string, avatar?: string, bio?: string) {
    const slug = CreateSlug(name);
    try {
      const actor = await this.prisma.actor.upsert({
        where: { slug },
        update: { name, avatar, bio },
        create: { name, slug, avatar, bio },
      });
      return actor;
    } catch (error) {
      this.logger.error(`Error saving actor ${name}:`, error);
      throw error;
    }
  }

  // lưu keyword
  async crawlAndSaveKeyword(name: string) {
    const slug = CreateSlug(name);
    try {
      const keyword = await this.prisma.keyword.upsert({
        where: { slug },
        update: { name },
        create: { name, slug },
      });
      return keyword;
    } catch (error) {
      this.logger.error(`Error saving keyword ${name}:`, error);
      throw error;
    }
  }

  // lưu tập phim
  async crawlAndSaveEpisodes(filmId: number, episodes: any[]) {
    for (const server of episodes) {
      for (const ep of server.server_data || []) {
        const episodeNumber = Number(ep.name) || 1;

        await this.prisma.episode.upsert({
          where: {
            filmId_episodeNumber: {
              filmId,
              episodeNumber,
            },
          },
          update: {
            title: `Tập ${episodeNumber}`,
            linkM3u8: ep.link_m3u8 as string,
            linkEmbed: ep.link_embed as string,
          },
          create: {
            filmId,
            episodeNumber,
            title: `Tập ${episodeNumber}`,
            linkM3u8: ep.link_m3u8 as string,
            linkEmbed: ep.link_embed as string,
            status: 'active',
          },
        });
      }
    }
  }

  async randomFilmCountryFromCategory() {
    // Lấy tất cả category type = country
    const countries = await this.prisma.category.findMany({
      where: { type: 'country' },
      select: { id: true },
    });

    if (!countries.length) {
      throw new Error('Không có category type = country');
    }

    // Lấy tất cả film
    const films = await this.prisma.film.findMany({
      select: { id: true },
    });

    for (const film of films) {
      const randomCountry =
        countries[Math.floor(Math.random() * countries.length)];

      // Xoá country cũ (nếu có)
      await this.prisma.filmCategory.deleteMany({
        where: {
          filmId: film.id,
          category: {
            type: 'country',
          },
        },
      });

      // Gán country mới
      await this.prisma.filmCategory.create({
        data: {
          filmId: film.id,
          categoryId: randomCountry.id,
        },
      });
    }
  }

  async syncFilmTypeByEpisodes() {
    const films = await this.prisma.film.findMany({
      select: {
        id: true,
        type: true,
        episodes: {
          select: { id: true },
        },
      },
    });

    let updated = 0;

    for (const film of films) {
      const newType = film.episodes.length > 0 ? 'tv' : 'movie';

      if (film.type !== newType) {
        await this.prisma.film.update({
          where: { id: film.id },
          data: { type: newType },
        });
        updated++;
      }
    }
  }

  // Crawl và lưu film
  async crawlAndSaveFilm(filmData: {
    title: string;
    slug?: string;
    nameNormalized?: string;
    description?: string;
    poster?: string;
    thumbnail?: string;
    year?: number;
    duration?: number;
    rating?: number;
    linkM3u8?: string;
    linkWebview?: string;
    categories?: string[];
    countries?: string[];
    actors?: string[];
    keywords?: string[];
    episodes?: any;
    type?: string;
  }) {
    const slug = filmData.slug ?? CreateSlug(filmData.title);
    const nameNormalized = filmData.nameNormalized || '';

    try {
      const categoryIds: number[] = [];
      if (filmData.categories) {
        for (const name of filmData.categories) {
          const category = await this.crawlAndSaveCategory(name, 'genre');
          categoryIds.push(category.id);
        }
      }

      const countryIds: number[] = [];
      if (filmData.countries) {
        for (const name of filmData.countries) {
          const country = await this.crawlAndSaveCategory(name, 'country');
          countryIds.push(country.id);
        }
      }

      const actorIds: number[] = [];
      if (filmData.actors) {
        for (const actorName of filmData.actors) {
          const actor = await this.crawlAndSaveActor(actorName);
          actorIds.push(actor.id);
        }
      }

      const keywordIds: number[] = [];
      if (filmData.keywords) {
        for (const keywordName of filmData.keywords) {
          const keyword = await this.crawlAndSaveKeyword(keywordName);
          keywordIds.push(keyword.id);
        }
      }

      // // Tạo hoặc cập nhật film
      const film = await this.prisma.film.upsert({
        where: { slug },
        update: {
          title: filmData.title,
          nameNormalized: nameNormalized || undefined,
          description: filmData.description,
          poster: filmData.poster,
          thumbnail: filmData.thumbnail,
          year: filmData.year,
          duration: filmData.duration,
          rating: filmData.rating,
          linkM3u8: filmData.linkM3u8,
          linkWebview: filmData.linkWebview,
        },
        create: {
          title: filmData.title,
          slug,
          nameNormalized: nameNormalized || undefined,
          description: filmData.description,
          poster: filmData.poster,
          thumbnail: filmData.thumbnail,
          year: filmData.year,
          duration: filmData.duration,
          rating: filmData.rating,
          linkM3u8: filmData.linkM3u8,
          linkWebview: filmData.linkWebview,
        },
      });

      if (
        filmData.episodes &&
        filmData.episodes?.length > 0 &&
        filmData.type === 'tv'
      ) {
        await this.crawlAndSaveEpisodes(film.id, filmData.episodes);
      }

      if (
        categoryIds.length > 0 ||
        actorIds.length > 0 ||
        keywordIds.length > 0
      ) {
        await this.prisma.filmCategory.deleteMany({
          where: { filmId: film.id },
        });
        await this.prisma.filmActor.deleteMany({ where: { filmId: film.id } });
        await this.prisma.filmKeyword.deleteMany({
          where: { filmId: film.id },
        });

        await this.prisma.filmCategory.createMany({
          data: categoryIds.map((id) => ({ filmId: film.id, categoryId: id })),
        });
        await this.prisma.filmActor.createMany({
          data: actorIds.map((id) => ({ filmId: film.id, actorId: id })),
        });
        await this.prisma.filmKeyword.createMany({
          data: keywordIds.map((id) => ({ filmId: film.id, keywordId: id })),
        });
      }

      this.logger.log(`Saved film: ${film.title}`);
      return film;
      // return true;
    } catch (error) {
      this.logger.error(`Error saving film ${filmData.title}:`, error);
      throw error;
    }
  }

  async crawlFromUrl(url: string) {
    try {
      this.logger.log(`Crawling from URL: ${url}`);
      const response = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 30000,
      });

      const $ = cheerio.load(response.data);

      const title = $('h1').first().text().trim();
      const description = $('.description').text().trim();
      const poster = $('.poster img').attr('src');
      const year = parseInt($('.year').text()) || undefined;
      const rating = parseFloat($('.rating').text()) || undefined;

      const categories: string[] = [];
      $('.categories a').each((_, el) => {
        categories.push($(el).text().trim());
      });

      const actors: string[] = [];
      $('.actors a').each((_, el) => {
        actors.push($(el).text().trim());
      });

      const linkM3u8 = $('[data-type="m3u8"]').attr('data-url');
      const linkWebview = $('[data-type="webview"]').attr('data-url');

      await this.crawlAndSaveFilm({
        title,
        description,
        poster,
        year,
        rating,
        linkM3u8,
        linkWebview,
        categories,
        actors,
      });

      this.logger.log(`Successfully crawled: ${title}`);
    } catch (error) {
      this.logger.error(`Error crawling URL ${url}:`, error);
      throw error;
    }
  }

  async crawlMultipleUrls(urls: string[]) {
    const results: {
      url: string;
      success: boolean;
      error?: string;
    }[] = [];

    for (const url of urls) {
      try {
        await this.crawlFromUrl(url);
        results.push({ url, success: true });
      } catch (error: unknown) {
        let message = 'Lỗi không xác định';

        if (error instanceof Error) {
          message = error.message;
        }

        results.push({
          url,
          success: false,
          error: message,
        });
      }
    }

    return results;
  }
}
