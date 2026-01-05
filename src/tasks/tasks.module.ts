import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CrawlerModule } from 'src/crawler/crawler.module';

@Module({
  providers: [TasksService],
  imports: [CrawlerModule],
  exports: [TasksService],
})
export class TasksModule {}
