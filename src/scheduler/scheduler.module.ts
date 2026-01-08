import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { CrawlerModule } from '../crawler/crawler.module';
import { TasksModule } from 'src/tasks/tasks.module';

@Module({
  imports: [ScheduleModule.forRoot(), CrawlerModule, TasksModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
