import { Module } from '@nestjs/common';
import { FilmsController } from './films.controller';
import { FilmsService } from './films.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ViewCountModule } from '../view-count/view-count.module';

@Module({
  imports: [PrismaModule, ViewCountModule],
  controllers: [FilmsController],
  providers: [FilmsService],
  exports: [FilmsService],
})
export class FilmsModule {}
