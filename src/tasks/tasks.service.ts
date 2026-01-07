import { Injectable } from '@nestjs/common';
import { Gaxios } from 'gaxios';
import { CrawlerService } from 'src/crawler/crawler.service';
import { normalize, parseDuration, sleep } from 'utils/util';

@Injectable()
export class TasksService {
  private readonly BASE_URL = 'https://ophim1.com/v1/api';
  private readonly http = new Gaxios({
    timeout: 30000,
  });

  constructor(private readonly crawlerService: CrawlerService) {}

  async updateFilmTypeByEpisodes() {
    await this.crawlerService.syncFilmTypeByEpisodes();
  }

  async randomFilmCountry() {
    await this.crawlerService.randomFilmCountryFromCategory();
  }

  async crawlMovies(limit = 200) {
    let page = 1;
    let crawled = 0;

    while (crawled < limit) {
      const listRes = await this.http.request<any>({
        url: `${this.BASE_URL}/danh-sach/phim-moi?page=${page}`,
        method: 'GET',
      });

      const items = listRes.data?.data?.items || [];
      if (items.length === 0) break;
      for (const item of items) {
        if (crawled >= limit) break;

        await this.crawlDetail(item.slug);
        crawled++;

        await sleep(800);
      }

      page++;
    }

    console.log(`Crawled ${crawled} movies`);
  }

  private async crawlDetail(slug: string) {
    try {
      const res = await this.http.request<{
        data?: {
          item?: any;
        };
      }>({
        url: `${this.BASE_URL}/phim/${slug}`,
        method: 'GET',
      });

      const movie = res?.data?.data?.item;
      if (!movie?.name) {
        return;
      }

      // ===== CLEAN DATA =====
      const cleanArray = (arr?: (string | null)[]) =>
        arr?.map((v) => v?.trim())?.filter((v): v is string => !!v);

      const categories =
        cleanArray(movie?.category?.map((c: any) => c?.name)) || [];
      const countries =
        cleanArray(movie?.country?.map((c: any) => c?.name)) || [];
      const actors = cleanArray(movie?.actor) || [];
      const keywords =
        cleanArray([
          movie?.name ?? null,
          movie?.origin_name ?? null,
          ...categories,
          ...countries,
          ...actors,
        ]) || [];

      await this.crawlerService.crawlAndSaveFilm({
        title: movie.name?.trim() || movie.origin_name?.trim(),
        nameNormalized: normalize(
          movie.name?.trim() || movie.origin_name?.trim(),
        ),
        slug: movie.slug,
        description: movie.content?.trim(),
        poster: movie.poster_url || undefined,
        thumbnail: movie.thumb_url || undefined,
        year: movie.year ? Number(movie.year) : undefined,
        duration: parseDuration(movie.time),
        rating:
          movie.tmdb?.vote_average !== undefined
            ? Number(movie.tmdb.vote_average)
            : undefined,
        linkWebview: movie.trailer_url?.trim() || undefined,
        linkM3u8: movie.episodes?.[0]?.server_data?.[0]?.link_m3u8 || undefined,
        categories,
        countries,
        actors,
        keywords,
        episodes: movie.episodes,
        type: movie.tmdb?.type || 'movie',
      });

      console.log(`🎬 Saved: ${movie.name}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to crawl slug ${slug}: ${message}`);
    }
  }
}
