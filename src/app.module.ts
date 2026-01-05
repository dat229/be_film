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
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    PrismaModule,
    FilmsModule,
    CategoriesModule,
    ActorsModule,
    KeywordsModule,
    CrawlerModule,
    SchedulerModule,
    TasksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
