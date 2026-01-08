import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ViewCountService } from './view-count.service';

@Injectable()
export class ViewCountSchedulerService {
  private readonly logger = new Logger(ViewCountSchedulerService.name);

  constructor(private viewCountService: ViewCountService) {}

  //5 phút đẩy views vào pending
  @Cron('*/5 * * * *')
  async collectViewsToPending() {
    this.logger.log('Bắt đầu collect views từ Redis sang pending...');

    try {
      await this.viewCountService.collectViewsToPending();
    } catch (error) {
      this.logger.error('Lỗi khi đẩy views vào pending:', error);
    }
  }

  //2 phút xử lý tăng view catch pending
  @Cron('*/2 * * * *')
  async processPendingBatches() {
    this.logger.log('Bắt đầu xử lý pending...');
    try {
      const batchIds = await this.viewCountService.getPendingBatches();

      if (batchIds.length === 0) {
        return;
      }

      for (const batchId of batchIds) {
        try {
          await this.viewCountService.processPendingBatch(batchId);
        } catch (error) {
          this.logger.error(`Lỗi xử lý batch ${batchId}:`, error);
        }
      }
    } catch (error) {
      this.logger.error('Lỗi khi xử lý pending:', error);
    }
  }

  // chạy lại các pending cũ
  @Cron(CronExpression.EVERY_HOUR)
  async retryOldPendingBatches() {
    try {
      const batchIds = await this.viewCountService.getPendingBatches();

      if (batchIds.length === 0) {
        return;
      }

      for (const batchId of batchIds) {
        try {
          await this.viewCountService.processPendingBatch(batchId);
        } catch (error) {
          this.logger.error(`Lỗi retry cũ ${batchId}:`, error);
        }
      }
    } catch (error) {
      this.logger.error('Lỗi khi retry old pending:', error);
    }
  }
}
