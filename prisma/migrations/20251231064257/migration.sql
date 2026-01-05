-- CreateTable
CREATE TABLE `categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `categories_name_key`(`name`),
    UNIQUE INDEX `categories_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `actors` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `avatar` VARCHAR(191) NULL,
    `bio` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `actors_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `keywords` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `keywords_name_key`(`name`),
    UNIQUE INDEX `keywords_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `films` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `poster` VARCHAR(191) NULL,
    `thumbnail` VARCHAR(191) NULL,
    `year` INTEGER NULL,
    `duration` INTEGER NULL,
    `rating` DOUBLE NULL DEFAULT 0,
    `viewCount` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `linkM3u8` VARCHAR(191) NULL,
    `linkWebview` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `films_slug_key`(`slug`),
    INDEX `films_slug_idx`(`slug`),
    INDEX `films_year_idx`(`year`),
    INDEX `films_viewCount_idx`(`viewCount`),
    INDEX `films_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `film_categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `filmId` INTEGER NOT NULL,
    `categoryId` INTEGER NOT NULL,

    UNIQUE INDEX `film_categories_filmId_categoryId_key`(`filmId`, `categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `film_actors` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `filmId` INTEGER NOT NULL,
    `actorId` INTEGER NOT NULL,

    UNIQUE INDEX `film_actors_filmId_actorId_key`(`filmId`, `actorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `film_keywords` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `filmId` INTEGER NOT NULL,
    `keywordId` INTEGER NOT NULL,

    UNIQUE INDEX `film_keywords_filmId_keywordId_key`(`filmId`, `keywordId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `film_categories` ADD CONSTRAINT `film_categories_filmId_fkey` FOREIGN KEY (`filmId`) REFERENCES `films`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `film_categories` ADD CONSTRAINT `film_categories_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `film_actors` ADD CONSTRAINT `film_actors_filmId_fkey` FOREIGN KEY (`filmId`) REFERENCES `films`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `film_actors` ADD CONSTRAINT `film_actors_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `actors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `film_keywords` ADD CONSTRAINT `film_keywords_filmId_fkey` FOREIGN KEY (`filmId`) REFERENCES `films`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `film_keywords` ADD CONSTRAINT `film_keywords_keywordId_fkey` FOREIGN KEY (`keywordId`) REFERENCES `keywords`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
