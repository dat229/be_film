import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TasksService } from 'src/tasks/tasks.service';

@Injectable()
export class SchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private tasksService: TasksService) {}

  onModuleInit() {
    this.logger.log('Scheduler service initialized');
  }

  onModuleDestroy() {
    this.logger.log('Scheduler service destroyed');
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleHourlyCrawl() {
    this.logger.log('Running crawl...');
    try {
      await this.tasksService.crawlMovies(10);
      this.logger.log('Crawl completed');
    } catch (error) {
      this.logger.error('Error crawling:', error);
    }
  }
}
