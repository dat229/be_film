import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ViewCountService {
  private readonly logger = new Logger(ViewCountService.name);

  constructor(
    private cacheService: CacheService,
    private prisma: PrismaService,
  ) {}

  async incrementView(filmId: number): Promise<{ success: boolean }> {
    if (!this.cacheService.isAvailable()) {
      return this.incrementViewDirectly(filmId);
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dateKey = today.toISOString().split('T')[0];

      const viewKey = `views:film:${filmId}:${dateKey}`;
      // cache 7 ngày
      await this.cacheService.increment(viewKey, 7 * 24 * 60 * 60);

      return { success: true };
    } catch (error) {
      this.logger.error(`Lỗi increment view cho film ${filmId}:`, error);
      return this.incrementViewDirectly(filmId);
    }
  }

  private async incrementViewDirectly(filmId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.prisma.$transaction(async (tx) => {
      await tx.film.update({
        where: { id: filmId },
        data: {
          viewCount: { increment: 1 },
        },
      });

      await tx.filmDailyView.upsert({
        where: {
          filmId_date: {
            filmId: filmId,
            date: today,
          },
        },
        update: {
          viewCount: { increment: 1 },
        },
        create: {
          filmId: filmId,
          date: today,
          viewCount: 1,
        },
      });
    });

    return { success: true };
  }

  // tổng view tự tăng, pending là trạng thái mặc định
  async collectViewsToPending(): Promise<string | null> {
    if (!this.cacheService.isAvailable()) {
      this.logger.warn('Redis không available, bỏ qua collect views');
      return null;
    }

    const batchId = `batch:${Date.now()}`;
    const client = this.cacheService.getClient();

    if (!client) {
      return null;
    }

    try {
      const keys = await this.cacheService.getKeys('views:film:*:*');

      if (keys.length === 0) {
        return null;
      }

      const viewData: Array<{ filmId: number; date: string; count: number }> =
        [];

      for (const key of keys) {
        const value = await client.get(key);
        const count = value ? parseInt(value, 10) : 0;
        if (count > 0) {
          const parts = key.split(':');
          const filmId = parseInt(parts[2], 10);
          const date = parts[3];

          viewData.push({ filmId, date, count });
        }
      }

      if (viewData.length === 0) {
        return null;
      }

      const pendingKey = `pending:views:${batchId}`;
      await this.cacheService.set(
        pendingKey,
        {
          batchId,
          createdAt: new Date().toISOString(),
          views: viewData,
        },
        24 * 60 * 60,
      );

      for (const key of keys) {
        await this.cacheService.delete(key);
      }

      this.logger.log(
        `Đã collect ${viewData.length} view records vào pending batch ${batchId}`,
      );

      return batchId;
    } catch (error) {
      this.logger.error('Lỗi collect views to pending:', error);
      return null;
    }
  }

  async processPendingBatch(batchId: string): Promise<boolean> {
    if (!this.cacheService.isAvailable()) {
      return false;
    }

    const pendingKey = `pending:views:${batchId}`;

    try {
      const pendingData = await this.cacheService.get<{
        batchId: string;
        createdAt: string;
        views: Array<{ filmId: number; date: string; count: number }>;
      }>(pendingKey);

      if (!pendingData) {
        this.logger.warn(`Pending batch ${batchId} không tồn tại`);
        return false;
      }
      const { views } = pendingData;

      if (!views || views.length === 0) {
        await this.cacheService.delete(pendingKey);
        return true;
      }

      // group views by filmId và date để batch update
      const viewMap = new Map<string, number>();
      for (const view of views) {
        const key = `${view.filmId}:${view.date}`;
        viewMap.set(key, (viewMap.get(key) || 0) + view.count);
      }

      await this.prisma.$transaction(async (tx) => {
        for (const [key, count] of viewMap.entries()) {
          const [filmIdStr, dateStr] = key.split(':');
          const filmId = parseInt(filmIdStr, 10);
          const date = new Date(dateStr);

          await tx.film.update({
            where: { id: filmId },
            data: {
              viewCount: { increment: count },
            },
          });

          await tx.filmDailyView.upsert({
            where: {
              filmId_date: {
                filmId: filmId,
                date: date,
              },
            },
            update: {
              viewCount: { increment: count },
            },
            create: {
              filmId: filmId,
              date: date,
              viewCount: count,
            },
          });
        }
      });

      await this.cacheService.delete(pendingKey);

      await this.cacheService.delete('films:trending:7days');

      return true;
    } catch (error) {
      this.logger.error(`Lỗi xử lý pending batch ${batchId}:`, error);
      return false;
    }
  }

  async getPendingBatches(): Promise<string[]> {
    if (!this.cacheService.isAvailable()) {
      return [];
    }

    try {
      const keys = await this.cacheService.getKeys('pending:views:*');
      return keys.map((key: string) => key.replace('pending:views:', ''));
    } catch (error) {
      this.logger.error('Lỗi lấy pending batches:', error);
      return [];
    }
  }
}
