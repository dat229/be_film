import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CrawlerService } from '../crawler/crawler.service';

@Injectable()
export class SchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private crawlerService: CrawlerService) {}

  onModuleInit() {
    this.logger.log('Scheduler service initialized');
  }

  onModuleDestroy() {
    this.logger.log('Scheduler service destroyed');
  }

  /**
   * Chạy crawler mỗi giờ
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlyCrawl() {
    this.logger.log('Running hourly crawl...');
    try {
      // Thêm logic crawl ở đây
      // Ví dụ: crawl các phim mới nhất
      const urlsToCrawl = [
        // Add URLs to crawl hourly
      ];

      if (urlsToCrawl.length > 0) {
        await this.crawlerService.crawlMultipleUrls(urlsToCrawl);
        this.logger.log('Hourly crawl completed');
      }
    } catch (error) {
      this.logger.error('Error in hourly crawl:', error);
    }
  }

  /**
   * Chạy crawler mỗi ngày lúc 2 giờ sáng
   */
  @Cron('0 2 * * *')
  async handleDailyCrawl() {
    this.logger.log('Running daily crawl...');
    try {
      // Thêm logic crawl ở đây
      // Ví dụ: crawl toàn bộ danh sách phim
      const urlsToCrawl = [
        // Add URLs to crawl daily
      ];

      if (urlsToCrawl.length > 0) {
        await this.crawlerService.crawlMultipleUrls(urlsToCrawl);
        this.logger.log('Daily crawl completed');
      }
    } catch (error) {
      this.logger.error('Error in daily crawl:', error);
    }
  }

  /**
   * Chạy crawler mỗi 30 phút
   */
  @Cron('*/30 * * * *')
  async handleFrequentCrawl() {
    this.logger.log('Running frequent crawl...');
    try {
      // Thêm logic crawl ở đây
      // Ví dụ: crawl các phim hot/trending
      const urlsToCrawl = [
        // Add URLs to crawl frequently
      ];

      if (urlsToCrawl.length > 0) {
        await this.crawlerService.crawlMultipleUrls(urlsToCrawl);
        this.logger.log('Frequent crawl completed');
      }
    } catch (error) {
      this.logger.error('Error in frequent crawl:', error);
    }
  }
}
