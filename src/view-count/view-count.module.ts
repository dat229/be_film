import { Module } from '@nestjs/common';
import { ViewCountService } from './view-count.service';
import { ViewCountSchedulerService } from './view-count-scheduler.service';
import { CacheModule } from '../cache/cache.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [CacheModule, PrismaModule],
  providers: [ViewCountService, ViewCountSchedulerService],
  exports: [ViewCountService],
})
export class ViewCountModule {}

