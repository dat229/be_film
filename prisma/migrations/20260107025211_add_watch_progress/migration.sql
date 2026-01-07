-- CreateTable
CREATE TABLE `watch_progress` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `deviceId` VARCHAR(191) NOT NULL,
    `filmId` INTEGER NOT NULL,
    `episodeId` INTEGER NULL,
    `currentTime` DOUBLE NOT NULL DEFAULT 0,
    `duration` DOUBLE NOT NULL DEFAULT 0,
    `completed` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `watch_progress_deviceId_idx`(`deviceId`),
    INDEX `watch_progress_filmId_idx`(`filmId`),
    INDEX `watch_progress_episodeId_idx`(`episodeId`),
    UNIQUE INDEX `watch_progress_deviceId_filmId_episodeId_key`(`deviceId`, `filmId`, `episodeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `watch_progress` ADD CONSTRAINT `watch_progress_filmId_fkey` FOREIGN KEY (`filmId`) REFERENCES `films`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `watch_progress` ADD CONSTRAINT `watch_progress_episodeId_fkey` FOREIGN KEY (`episodeId`) REFERENCES `episodes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
