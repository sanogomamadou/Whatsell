import { Injectable, OnModuleInit, OnModuleDestroy, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '../../generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(configService: ConfigService) {
    const databaseUrl = configService.get<string>('database.url');
    if (!databaseUrl) {
      throw new InternalServerErrorException('DATABASE_URL est requis pour PrismaService');
    }
    const adapter = new PrismaPg({ connectionString: databaseUrl });
    super({ adapter } as Prisma.PrismaClientOptions);
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
