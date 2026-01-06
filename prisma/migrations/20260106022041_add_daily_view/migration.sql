-- CreateTable
CREATE TABLE `film_daily_views` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `filmId` INTEGER NOT NULL,
    `date` DATE NOT NULL,
    `viewCount` INTEGER NOT NULL DEFAULT 0,

    INDEX `film_daily_views_filmId_idx`(`filmId`),
    INDEX `film_daily_views_date_idx`(`date`),
    UNIQUE INDEX `film_daily_views_filmId_date_key`(`filmId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `film_daily_views` ADD CONSTRAINT `film_daily_views_filmId_fkey` FOREIGN KEY (`filmId`) REFERENCES `films`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
