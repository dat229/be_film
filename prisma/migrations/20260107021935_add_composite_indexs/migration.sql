-- CreateIndex
CREATE INDEX `films_status_viewCount_idx` ON `films`(`status`, `viewCount`);

-- CreateIndex
CREATE INDEX `films_status_createdAt_idx` ON `films`(`status`, `createdAt`);

-- CreateIndex
CREATE INDEX `films_status_rating_idx` ON `films`(`status`, `rating`);

-- CreateIndex
CREATE INDEX `films_status_type_idx` ON `films`(`status`, `type`);
