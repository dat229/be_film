import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { TasksService } from '../src/tasks/tasks.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const tasksService = app.get(TasksService);
    await tasksService.crawlMovies(200);
    // await tasksService.updateFilmTypeByEpisodes();
    await tasksService.randomFilmCountry();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap().catch((error) => {
  console.error('Bootstrap error:', error);
  process.exit(1);
});
