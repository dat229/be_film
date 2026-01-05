import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from 'src/generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const adapter = new PrismaMariaDb({
      host: process.env.DATABASE_HOST,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      connectionLimit: 50,
      port: 3306,
    });
    super({ adapter });
  }

  async onModuleInit() {
    try {
      await this.$connect(); // kết nối DB
      console.log('Database connected successfully');
    } catch (err) {
      console.error('Database connection failed:', err);
    }
  }
}
