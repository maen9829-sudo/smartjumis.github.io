import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Predefined categories for the platform
const SEED_CATEGORIES = [
  { name: 'Web Development',    nameRu: 'Веб-разработка',      nameKk: 'Веб-әзірлеу',      slug: 'web-development',    icon: 'code' },
  { name: 'Mobile Development', nameRu: 'Мобильная разработка', nameKk: 'Мобильді әзірлеу',  slug: 'mobile-development', icon: 'smartphone' },
  { name: 'Design',             nameRu: 'Дизайн',               nameKk: 'Дизайн',            slug: 'design',             icon: 'palette' },
  { name: 'Marketing',          nameRu: 'Маркетинг',            nameKk: 'Маркетинг',         slug: 'marketing',          icon: 'trending-up' },
  { name: 'Copywriting',        nameRu: 'Копирайтинг',          nameKk: 'Копирайтинг',       slug: 'copywriting',        icon: 'pen-tool' },
  { name: 'Video & Animation',  nameRu: 'Видео и анимация',     nameKk: 'Бейне және анимация', slug: 'video-animation',  icon: 'film' },
  { name: 'Data & AI',          nameRu: 'Данные и ИИ',          nameKk: 'Деректер және ЖИ',  slug: 'data-ai',            icon: 'cpu' },
  { name: 'Business',           nameRu: 'Бизнес',               nameKk: 'Бизнес',            slug: 'business',           icon: 'briefcase' },
];

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  // GET /categories - return all categories
  async findAll() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { projects: { where: { status: 'OPEN' } } } },
      },
    });
  }

  // GET /categories/:slug - category + its open projects
  async findBySlug(slug: string) {
    return this.prisma.category.findUniqueOrThrow({
      where: { slug },
      include: {
        projects: {
          where: { status: 'OPEN' },
          include: {
            client: { select: { id: true, name: true, avatarUrl: true } },
            _count: { select: { proposals: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
  }

  // Called once to seed categories into DB (idempotent)
  async seed() {
    for (const cat of SEED_CATEGORIES) {
      await this.prisma.category.upsert({
        where: { slug: cat.slug },
        update: {},
        create: cat,
      });
    }
    return { seeded: SEED_CATEGORIES.length };
  }
}
