import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActorDto, UpdateActorDto } from './dto';

@Injectable()
export class ActorsService {
  constructor(private prisma: PrismaService) {}

  create(createActorDto: CreateActorDto) {
    return this.prisma.actor.create({
      data: createActorDto,
    });
  }

  findAll() {
    return this.prisma.actor.findMany({
      orderBy: { name: 'asc' },
    });
  }

  findOne(id: number) {
    return this.prisma.actor.findUnique({
      where: { id },
      include: {
        films: {
          include: {
            film: {
              include: {
                categories: { include: { category: true } },
                actors: { include: { actor: true } },
              },
            },
          },
        },
      },
    });
  }

  update(id: number, updateActorDto: UpdateActorDto) {
    return this.prisma.actor.update({
      where: { id },
      data: updateActorDto,
    });
  }

  remove(id: number) {
    return this.prisma.actor.delete({
      where: { id },
    });
  }
}













