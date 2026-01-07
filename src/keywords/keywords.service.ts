import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateKeywordDto, UpdateKeywordDto } from './dto';

@Injectable()
export class KeywordsService {
  constructor(private prisma: PrismaService) {}

  create(createKeywordDto: CreateKeywordDto) {
    return this.prisma.keyword.create({
      data: createKeywordDto,
    });
  }

  findAll() {
    return this.prisma.keyword.findMany({
      orderBy: { name: 'asc' },
    });
  }

  findOne(id: number) {
    return this.prisma.keyword.findUnique({
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

  update(id: number, updateKeywordDto: UpdateKeywordDto) {
    return this.prisma.keyword.update({
      where: { id },
      data: updateKeywordDto,
    });
  }

  remove(id: number) {
    return this.prisma.keyword.delete({
      where: { id },
    });
  }
}
