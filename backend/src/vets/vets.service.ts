import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

interface FindVetsOptions {
  userId: string;
  query: string;
  city: string;
  page: number;
  limit: number;
}

@Injectable()
export class VetsService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(options: FindVetsOptions) {
    const supportedCities = ['София', 'Пловдив', 'Варна', 'Бургас'];
    const cityFilter = supportedCities.includes(options.city.trim())
      ? options.city.trim()
      : '';

    const searchValue = options.query.trim();

    const page = Math.max(1, options.page);
    const limit = Math.min(50, Math.max(1, options.limit));
    const skip = (page - 1) * limit;

    const searchTerms = searchValue
      .split(/\s+/)
      .filter(Boolean);

    const where = {
      role: 'VET' as const,
      vetApproved: true,

      ...(cityFilter && {
        city: {
          equals: cityFilter,
          mode: 'insensitive' as const,
        },
      }),

      ...(searchTerms.length > 0 && {
        AND: searchTerms.map((term) => ({
          OR: [
            {
              firstName: {
                contains: term,
                mode: 'insensitive' as const,
              },
            },
            {
              lastName: {
                contains: term,
                mode: 'insensitive' as const,
              },
            },
            {
              clinicName: {
                contains: term,
                mode: 'insensitive' as const,
              },
            },
            {
              city: {
                contains: term,
                mode: 'insensitive' as const,
              },
            },
          ],
        })),
      }),
    };

    const [vets, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          clinicName: true,
          clinicAddress: true,
          city: true,
        },
        orderBy: [
          { city: 'asc' },
          { firstName: 'asc' },
          { lastName: 'asc' },
        ],
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: vets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}