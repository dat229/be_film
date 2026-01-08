import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { FilmsModule } from './films/films.module';
import { CategoriesModule } from './categories/categories.module';
import { ActorsModule } from './actors/actors.module';
import { KeywordsModule } from './keywords/keywords.module';
import { CrawlerModule } from './crawler/crawler.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { TasksModule } from './tasks/tasks.module';
import { WatchProgressModule } from './watch-progress/watch-progress.module';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from './cache/cache.module';
import { ViewCountModule } from './view-count/view-count.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    CacheModule,
    PrismaModule,
    FilmsModule,
    CategoriesModule,
    ActorsModule,
    KeywordsModule,
    CrawlerModule,
    SchedulerModule,
    TasksModule,
    WatchProgressModule,
    ViewCountModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
