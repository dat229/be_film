/**
 * Crawler Script - Chạy độc lập để crawl và lưu data vào DB
 *
 * Usage:
 *   ts-node src/crawler/crawler.script.ts
 *
 * Hoặc với npm script:
 *   npm run crawl
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { CrawlerService } from './crawler.service';

async function runCrawler() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const crawlerService = app.get(CrawlerService);

  try {
    console.log('Starting crawler...');

    // Ví dụ: Crawl một số URLs
    // Bạn cần thay đổi các URLs này thành URLs thực tế của website bạn muốn crawl
    const urlsToCrawl = [
      // 'https://example.com/film/1',
      // 'https://example.com/film/2',
      // Add more URLs here
    ];

    if (urlsToCrawl.length > 0) {
      const results = await crawlerService.crawlMultipleUrls(urlsToCrawl);
      console.log('Crawling results:', results);
    } else {
      // Hoặc crawl từ một nguồn khác
      // Ví dụ: crawl từ API, sitemap, etc.
      console.log('No URLs to crawl. Please add URLs to crawl.');

      // Ví dụ: Tạo sample data để test
      await crawlerService.crawlAndSaveFilm({
        title: 'Phim Mẫu 1',
        description: 'Đây là mô tả phim mẫu',
        year: 2024,
        rating: 8.5,
        categories: ['Hành động', 'Việt Nam'],
        actors: ['Diễn viên 1', 'Diễn viên 2'],
        keywords: ['phim hay', 'hành động'],
        linkM3u8: 'https://example.com/video.m3u8',
      });
    }

    console.log('Crawler completed!');
  } catch (error) {
    console.error('Crawler error:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

runCrawler();
