-- CreateTable
CREATE TABLE `episodes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `filmId` INTEGER NOT NULL,
    `episodeNumber` INTEGER NOT NULL,
    `title` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `linkM3u8` VARCHAR(191) NULL,
    `linkWebview` VARCHAR(191) NULL,
    `duration` INTEGER NULL,
    `viewCount` INTEGER NOT NULL DEFAULT 0,
    `thumbnail` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `episodes_filmId_idx`(`filmId`),
    INDEX `episodes_episodeNumber_idx`(`episodeNumber`),
    INDEX `episodes_status_idx`(`status`),
    UNIQUE INDEX `episodes_filmId_episodeNumber_key`(`filmId`, `episodeNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `episodes` ADD CONSTRAINT `episodes_filmId_fkey` FOREIGN KEY (`filmId`) REFERENCES `films`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
