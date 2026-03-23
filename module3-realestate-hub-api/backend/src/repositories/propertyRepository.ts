// =============================================================================
// REPOSITORIO DE PROPIEDADES - Module 3: RealEstate Hub API
// =============================================================================

import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import type { Property, PropertyFilters, CreatePropertyInput, UpdatePropertyInput } from '../types/property.js';

// =============================================================================
// CLIENTE PRISMA (Singleton con Adapter para Prisma 7)
// =============================================================================

const adapter = new PrismaBetterSqlite3({ url: 'file:./prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

// =============================================================================
// TIPOS INTERNOS
// =============================================================================

interface PrismaProperty {
  id: string;
  title: string;
  description: string;
  propertyType: string;
  operationType: string;
  price: number;
  address: string;
  city: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  amenities: string;
  images: string;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// TIPOS DE PAGINACIÓN Y ESTADÍSTICAS
// =============================================================================

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface PropertyStats {
  total: number;
  byType: Record<string, { count: number; avgPrice: number }>;
  priceRange: {
    min: number;
    max: number;
  };
}

// =============================================================================
// TRANSFORMADORES
// =============================================================================

function toProperty(dbProperty: PrismaProperty): Property {
  return {
    id: dbProperty.id,
    title: dbProperty.title,
    description: dbProperty.description,
    propertyType: dbProperty.propertyType as Property['propertyType'],
    operationType: dbProperty.operationType as Property['operationType'],
    price: dbProperty.price,
    address: dbProperty.address,
    city: dbProperty.city,
    bedrooms: dbProperty.bedrooms,
    bathrooms: dbProperty.bathrooms,
    area: dbProperty.area,
    amenities: JSON.parse(dbProperty.amenities) as Property['amenities'],
    images: JSON.parse(dbProperty.images) as Property['images'],
    createdAt: dbProperty.createdAt.toISOString(),
    updatedAt: dbProperty.updatedAt.toISOString(),
  };
}

function toPrismaData(data: CreatePropertyInput | UpdatePropertyInput): Record<string, unknown> {
  const result: Record<string, unknown> = { ...data };

  if ('amenities' in data && data.amenities) {
    result.amenities = JSON.stringify(data.amenities);
  }
  if ('images' in data && data.images) {
    result.images = JSON.stringify(data.images);
  }

  return result;
}

// =============================================================================
// REPOSITORIO
// =============================================================================

export const propertyRepository = {

  async findAll(
    filters?: PropertyFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Property>> {
    const where = buildWhereClause(filters);

    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 10;
    const skip = (page - 1) * limit;

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.property.count({ where }),
    ]);

    return {
      data: properties.map(toProperty),
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async findById(id: string): Promise<Property | null> {
    const property = await prisma.property.findUnique({
      where: { id },
    });

    return property ? toProperty(property) : null;
  },

  async create(data: CreatePropertyInput): Promise<Property> {
    const prismaData = toPrismaData(data);

    const property = await prisma.property.create({
      data: prismaData as Parameters<typeof prisma.property.create>[0]['data'],
    });

    return toProperty(property);
  },

  async update(id: string, data: UpdatePropertyInput): Promise<Property | null> {
    const existing = await prisma.property.findUnique({ where: { id } });
    if (!existing) return null;

    const prismaData = toPrismaData(data);

    const property = await prisma.property.update({
      where: { id },
      data: prismaData,
    });

    return toProperty(property);
  },

  async delete(id: string): Promise<boolean> {
    const existing = await prisma.property.findUnique({ where: { id } });
    if (!existing) return false;

    await prisma.property.delete({ where: { id } });
    return true;
  },

  async exists(id: string): Promise<boolean> {
    const property = await prisma.property.findUnique({
      where: { id },
      select: { id: true },
    });
    return property !== null;
  },

  // =============================================================================
  // GET /api/properties/stats
  // groupBy  → COUNT y AVG agrupado por propertyType
  // aggregate → MIN, MAX y COUNT global
  // Ambas queries corren en paralelo con Promise.all
  // =============================================================================

  async getStats(): Promise<PropertyStats> {
    const [groupedStats, globalStats] = await Promise.all([
      prisma.property.groupBy({
        by: ['propertyType'],
        _count: { id: true },
        _avg: { price: true },
      }),
      prisma.property.aggregate({
        _count: { id: true },
        _min: { price: true },
        _max: { price: true },
      }),
    ]);

    // Transformar array de groupBy a objeto { casa: { count, avgPrice }, ... }
    const byType: PropertyStats['byType'] = {};
    for (const group of groupedStats) {
      byType[group.propertyType] = {
        count: group._count.id,
        avgPrice: Math.round(group._avg.price ?? 0),
      };
    }

    return {
      total: globalStats._count.id,
      byType,
      priceRange: {
        min: globalStats._min.price ?? 0,
        max: globalStats._max.price ?? 0,
      },
    };
  },

};

// =============================================================================
// HELPERS
// =============================================================================

function buildWhereClause(filters?: PropertyFilters): Record<string, unknown> {
  if (!filters) return {};

  const where: Record<string, unknown> = {};

  if (filters.propertyType) {
    where.propertyType = filters.propertyType;
  }

  if (filters.operationType) {
    where.operationType = filters.operationType;
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.price = {};
    if (filters.minPrice !== undefined) {
      (where.price as Record<string, number>).gte = filters.minPrice;
    }
    if (filters.maxPrice !== undefined) {
      (where.price as Record<string, number>).lte = filters.maxPrice;
    }
  }

  if (filters.minBedrooms !== undefined) {
    where.bedrooms = { gte: filters.minBedrooms };
  }

  if (filters.city) {
    where.city = { contains: filters.city };
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search } },
      { description: { contains: filters.search } },
      { address: { contains: filters.search } },
      { city: { contains: filters.search } },
    ];
  }

  return where;
}

export default propertyRepository;