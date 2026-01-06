import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { CrawlerModule } from '../crawler/crawler.module';

@Module({
  imports: [ScheduleModule.forRoot(), CrawlerModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
