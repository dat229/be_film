import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWatchProgressDto } from './dto';

@Injectable()
export class WatchProgressService {
  constructor(private prisma: PrismaService) {}

  async upsert(createWatchProgressDto: CreateWatchProgressDto) { 
    console.log('createWatchProgressDto', createWatchProgressDto);
    const { deviceId, filmId, episodeId, currentTime, duration, completed } =
      createWatchProgressDto;

    // Tính toán completed dựa trên currentTime và duration (nếu >= 90% thì coi như completed)
    const isCompleted =
      completed !== undefined
        ? completed
        : duration > 0 && currentTime / duration >= 0.9;

    const episodeIdValue: number | null =
      episodeId !== undefined ? episodeId : null;

    return this.prisma.watchProgress.upsert({
      where: {
        deviceId_filmId_episodeId: {
          deviceId,
          filmId,
          episodeId: episodeIdValue as any,
        },
      },
      update: {
        currentTime,
        duration,
        completed: isCompleted,
        updatedAt: new Date(),
      },
      create: {
        deviceId,
        filmId,
        episodeId: episodeIdValue,
        currentTime,
        duration,
        completed: isCompleted,
      },
    });
  }

  async findByDeviceAndFilm(deviceId: string, filmId: number) {
    return this.prisma.watchProgress.findMany({
      where: {
        deviceId,
        filmId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async findByDeviceFilmAndEpisode(
    deviceId: string,
    filmId: number,
    episodeId?: number,
  ) {
    const episodeIdValue: number | null =
      episodeId !== undefined ? episodeId : null;

    return this.prisma.watchProgress.findUnique({
      where: {
        deviceId_filmId_episodeId: {
          deviceId,
          filmId,
          episodeId: episodeIdValue as any,
        },
      },
    });
  }

  async getRecentWatching(deviceId: string, limit: number = 20) {
    return this.prisma.watchProgress.findMany({
      where: {
        deviceId,
        completed: false,
      },
      include: {
        film: {
          select: {
            id: true,
            title: true,
            slug: true,
            poster: true,
            thumbnail: true,
            type: true,
          },
        },
        episode: {
          select: {
            id: true,
            episodeNumber: true,
            title: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: limit,
    });
  }

  async remove(deviceId: string, filmId: number, episodeId?: number) {
    const episodeIdValue: number | null =
      episodeId !== undefined ? episodeId : null;

    return this.prisma.watchProgress.delete({
      where: {
        deviceId_filmId_episodeId: {
          deviceId,
          filmId,
          episodeId: episodeIdValue as any,
        },
      },
    });
  }
}
