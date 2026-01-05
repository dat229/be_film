import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  create(createCategoryDto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: createCategoryDto,
    });
  }

  findAll(type?: string) {
    const where = type ? { type } : {};
    return this.prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  findOne(id: number) {
    return this.prisma.category.findUnique({
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

  update(id: number, updateCategoryDto: UpdateCategoryDto) {
    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  remove(id: number) {
    return this.prisma.category.delete({
      where: { id },
    });
  }
}
