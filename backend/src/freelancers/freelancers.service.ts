import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const CARD_SELECT = {
  id: true, name: true, avatarUrl: true, title: true,
  skills: true, hourlyRate: true, rating: true, reviewCount: true,
  completedJobs: true, successRate: true, city: true,
  isVerified: true, isTopRated: true, responseTime: true,
};

@Injectable()
export class FreelancersService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: {
    search?: string; skill?: string; minRate?: number;
    maxRate?: number; isTopRated?: boolean; page?: number; limit?: number;
  }) {
    const { search, skill, minRate, maxRate, isTopRated, page = 1, limit = 12 } = filters;

    const where: any = { isActive: true };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { bio: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (skill) where.skills = { has: skill };
    if (isTopRated) where.isTopRated = true;
    if (minRate || maxRate) {
      where.hourlyRate = {};
      if (minRate) where.hourlyRate.gte = minRate;
      if (maxRate) where.hourlyRate.lte = maxRate;
    }

    const [data, total] = await Promise.all([
      this.prisma.freelancer.findMany({
        where, select: CARD_SELECT,
        orderBy: [{ isTopRated: 'desc' }, { rating: 'desc' }],
        skip: (page - 1) * limit, take: limit,
      }),
      this.prisma.freelancer.count({ where }),
    ]);

    return { data, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const freelancer = await this.prisma.freelancer.findUnique({
      where: { id, isActive: true },
      include: {
        portfolio: { orderBy: { createdAt: 'desc' } },
        completedWork: { orderBy: { completedAt: 'desc' }, take: 10 },
        reviews: {
          include: { client: { select: { id: true, name: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: { select: { completedWork: true, portfolio: true } },
      },
    });

    if (!freelancer) throw new NotFoundException('Freelancer not found');

    // Compute "last seen" label for UX
    const minutesAgo = Math.floor(
      (Date.now() - freelancer.lastSeen.getTime()) / 60000,
    );
    const lastSeenLabel =
      minutesAgo < 60 ? `${minutesAgo} min ago`
      : minutesAgo < 1440 ? `${Math.floor(minutesAgo / 60)}h ago`
      : `${Math.floor(minutesAgo / 1440)}d ago`;

    return { ...freelancer, lastSeenLabel };
  }

  // GET /freelancers/featured — top 6 for landing page
  async findFeatured() {
    return this.prisma.freelancer.findMany({
      where: { isActive: true, isTopRated: true },
      select: CARD_SELECT,
      orderBy: { rating: 'desc' },
      take: 6,
    });
  }

  // Seed 10 realistic fake freelancers
  async seed() {
    const freelancers = getFakeFreelancers();
    let created = 0;

    for (const f of freelancers) {
      const { portfolio, completedWork, ...data } = f;

      const existing = await this.prisma.freelancer.findFirst({
        where: { name: data.name },
      });
      if (existing) continue;

      const fl = await this.prisma.freelancer.create({ data });

      // Add portfolio items
      if (portfolio?.length) {
        await this.prisma.portfolioItem.createMany({
          data: portfolio.map((p: any) => ({ ...p, freelancerId: fl.id })),
        });
      }

      // Add completed work history
      if (completedWork?.length) {
        await this.prisma.completedWork.createMany({
          data: completedWork.map((w: any) => ({ ...w, freelancerId: fl.id })),
        });
      }

      created++;
    }

    return { created, total: freelancers.length };
  }

  // Called by ProposalsService after proposal is auto-created
  async autoPropose(projectId: string, categorySlug: string) {
    // Find 3 best-matched freelancers by skills
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { skills: true, budget: true },
    });
    if (!project) return;

    const freelancers = await this.prisma.freelancer.findMany({
      where: { isActive: true },
      orderBy: { rating: 'desc' },
      take: 3,
    });

    for (const fl of freelancers) {
      const alreadyProposed = await this.prisma.proposal.findFirst({
        where: { projectId, freelancerId: fl.id },
      });
      if (alreadyProposed) continue;

      const price = project.budget
        ? Math.round(project.budget * (0.8 + Math.random() * 0.3))
        : fl.hourlyRate * 40;

      await this.prisma.proposal.create({
        data: {
          projectId,
          freelancerId: fl.id,
          coverLetter: generateCoverLetter(fl.name, fl.title),
          price,
          deliveryDays: 7 + Math.floor(Math.random() * 14),
          status: 'PENDING',
        },
      });
    }
  }
}

// ─── Cover letter generator ───────────────────────────────────────────────────
function generateCoverLetter(name: string, title: string): string {
  const intros = [
    `Здравствуйте! Меня зовут ${name}, я ${title} с опытом более 5 лет.`,
    `Добрый день! Я ${name} — ${title}. Ваш проект меня очень заинтересовал.`,
    `Привет! ${name} здесь. Как ${title}, я уверен что смогу помочь с этим проектом.`,
  ];
  const bodies = [
    'Я внимательно прочитал описание и готов приступить немедленно. Мой подход — чистый код и регулярная коммуникация.',
    'Похожие задачи я уже решал — смотрите мое портфолио. Гарантирую сроки и качество.',
    'У меня есть опыт именно с такими проектами. Готов обсудить детали и ответить на вопросы.',
  ];
  const closes = [
    'Буду рад сотрудничеству!',
    'Готов начать сегодня.',
    'Напишите — обсудим детали.',
  ];

  const r = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
  return `${r(intros)} ${r(bodies)} ${r(closes)}`;
}

// ─── Seed data ────────────────────────────────────────────────────────────────
function getFakeFreelancers() {
  const past = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  };

  return [
    {
      name: 'Алибек Сейткали',
      title: 'Full-Stack Developer',
      bio: 'Разрабатываю веб-приложения с нуля — от дизайна до деплоя. React, Node.js, PostgreSQL. 6 лет опыта, 80+ завершённых проектов.',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alibek',
      skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker'],
      languages: ['Казахский', 'Русский', 'Английский'],
      hourlyRate: 8000,
      rating: 4.9,
      reviewCount: 47,
      completedJobs: 80,
      successRate: 98,
      responseTime: 'within an hour',
      city: 'Алматы',
      isVerified: true,
      isTopRated: true,
      memberSince: past(900),
      lastSeen: past(0),
      portfolio: [
        { title: 'E-commerce платформа', description: 'Полноценный интернет-магазин с корзиной и оплатой', category: 'Web Development', skills: ['React', 'Node.js', 'Stripe'] },
        { title: 'CRM система для логистики', description: 'Управление заказами и складом в реальном времени', category: 'Web Development', skills: ['Next.js', 'PostgreSQL'] },
      ],
      completedWork: [
        { title: 'Разработка сайта для ресторана', clientName: 'Клиент из Алматы', budget: 350000, duration: '2 недели', completedAt: past(30), rating: 5.0, review: 'Отличная работа, всё сделал в срок!' },
        { title: 'Мобильная версия интернет-магазина', clientName: 'Клиент из Астаны', budget: 500000, duration: '3 недели', completedAt: past(70), rating: 4.8, review: 'Профессионально, рекомендую.' },
      ],
    },
    {
      name: 'Дина Жаксыбекова',
      title: 'UI/UX Designer',
      bio: 'Создаю интерфейсы, которыми приятно пользоваться. Figma, Prototyping, User Research. Работала с 50+ стартапами.',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dina',
      skills: ['Figma', 'UI Design', 'UX Research', 'Prototyping', 'Branding'],
      languages: ['Казахский', 'Русский'],
      hourlyRate: 6000,
      rating: 4.8,
      reviewCount: 38,
      completedJobs: 54,
      successRate: 100,
      responseTime: 'within an hour',
      city: 'Астана',
      isVerified: true,
      isTopRated: true,
      memberSince: past(700),
      lastSeen: past(0),
      portfolio: [
        { title: 'Дизайн приложения для доставки', description: 'Мобильное приложение с онбордингом и картой', category: 'Design', skills: ['Figma', 'Prototyping'] },
        { title: 'Ребрендинг медицинской клиники', description: 'Новый логотип, гайдлайны и веб-дизайн', category: 'Design', skills: ['Branding', 'UI Design'] },
      ],
      completedWork: [
        { title: 'Дизайн лендинга для стартапа', clientName: 'Клиент из Алматы', budget: 180000, duration: '1 неделя', completedAt: past(20), rating: 5.0, review: 'Дина — лучший дизайнер с кем я работал!' },
        { title: 'UI Kit для мобильного приложения', clientName: 'Клиент из США', budget: 450000, duration: '2 недели', completedAt: past(60), rating: 4.9, review: 'Очень детально и профессионально.' },
      ],
    },
    {
      name: 'Ерлан Байжанов',
      title: 'Mobile Developer (React Native)',
      bio: 'Специализируюсь на кросс-платформенных мобильных приложениях. iOS + Android из одного кодбейза. 40+ приложений в App Store.',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=erlan',
      skills: ['React Native', 'iOS', 'Android', 'Firebase', 'TypeScript'],
      languages: ['Казахский', 'Русский', 'Английский'],
      hourlyRate: 9000,
      rating: 4.9,
      reviewCount: 29,
      completedJobs: 42,
      successRate: 97,
      responseTime: 'within a day',
      city: 'Алматы',
      isVerified: true,
      isTopRated: false,
      memberSince: past(500),
      lastSeen: past(1),
      portfolio: [
        { title: 'Фитнес-трекер', description: 'iOS/Android приложение с трекингом тренировок', category: 'Mobile Development', skills: ['React Native', 'Firebase'] },
      ],
      completedWork: [
        { title: 'Приложение для онлайн-обучения', clientName: 'Клиент из Алматы', budget: 800000, duration: '6 недель', completedAt: past(45), rating: 5.0, review: 'Идеально! Всё работает отлично.' },
      ],
    },
    {
      name: 'Айгерим Нурлан',
      title: 'Digital Marketing Specialist',
      bio: 'Настраиваю таргетированную рекламу, веду SEO и контент-маркетинг. ROAS 4x+ для казахстанских брендов.',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=aigerim',
      skills: ['SEO', 'Google Ads', 'Facebook Ads', 'Content Marketing', 'Analytics'],
      languages: ['Казахский', 'Русский'],
      hourlyRate: 5000,
      rating: 4.7,
      reviewCount: 52,
      completedJobs: 68,
      successRate: 96,
      responseTime: 'within an hour',
      city: 'Алматы',
      isVerified: true,
      isTopRated: false,
      memberSince: past(600),
      lastSeen: past(0),
      portfolio: [
        { title: 'SEO-продвижение интернет-магазина', description: 'Вывел 50 запросов в ТОП-5 за 3 месяца', category: 'Marketing', skills: ['SEO', 'Analytics'] },
      ],
      completedWork: [
        { title: 'Рекламная кампания в Instagram', clientName: 'Клиент из Астаны', budget: 250000, duration: '1 месяц', completedAt: past(15), rating: 4.8, review: 'Результаты превзошли ожидания.' },
      ],
    },
    {
      name: 'Нурлан Касымов',
      title: 'Backend Developer',
      bio: 'Разрабатываю высоконагруженные API и микросервисы. Node.js, Go, PostgreSQL, Redis. Опыт 7 лет.',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nurlan',
      skills: ['Node.js', 'Go', 'PostgreSQL', 'Redis', 'AWS', 'Docker'],
      languages: ['Казахский', 'Русский', 'Английский'],
      hourlyRate: 10000,
      rating: 4.9,
      reviewCount: 33,
      completedJobs: 55,
      successRate: 99,
      responseTime: 'within a day',
      city: 'Астана',
      isVerified: true,
      isTopRated: true,
      memberSince: past(1100),
      lastSeen: past(0),
      portfolio: [
        { title: 'API для финтех-стартапа', description: 'REST API с обработкой 10k+ запросов в секунду', category: 'Web Development', skills: ['Go', 'PostgreSQL', 'Redis'] },
      ],
      completedWork: [
        { title: 'Микросервисная архитектура для e-commerce', clientName: 'Клиент из Алматы', budget: 1200000, duration: '2 месяца', completedAt: past(90), rating: 5.0, review: 'Нурлан — эксперт своего дела.' },
      ],
    },
    {
      name: 'Зарина Ахметова',
      title: 'Copywriter & Content Creator',
      bio: 'Пишу тексты которые продают. Сайты, соцсети, email-рассылки. SEO-копирайтинг. 300+ проектов.',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zarina',
      skills: ['Копирайтинг', 'SEO-тексты', 'SMM', 'Email-маркетинг', 'Сторителлинг'],
      languages: ['Казахский', 'Русский'],
      hourlyRate: 3500,
      rating: 4.8,
      reviewCount: 89,
      completedJobs: 120,
      successRate: 100,
      responseTime: 'within an hour',
      city: 'Шымкент',
      isVerified: true,
      isTopRated: true,
      memberSince: past(800),
      lastSeen: past(0),
      portfolio: [
        { title: 'Тексты для медицинского центра', description: 'Серия статей и лендинг с конверсией 8%', category: 'Copywriting', skills: ['Копирайтинг', 'SEO-тексты'] },
      ],
      completedWork: [
        { title: 'Контент-план на 3 месяца для бренда', clientName: 'Клиент из Алматы', budget: 150000, duration: '1 неделя', completedAt: past(10), rating: 5.0, review: 'Зарина пишет с душой, очень довольны!' },
      ],
    },
    {
      name: 'Асхат Темиров',
      title: 'Data Scientist & AI Engineer',
      bio: 'Создаю ML-модели и AI-решения для бизнеса. Python, TensorFlow, OpenAI API. 4 года в Data Science.',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=askhat',
      skills: ['Python', 'Machine Learning', 'OpenAI API', 'TensorFlow', 'Data Analysis'],
      languages: ['Казахский', 'Русский', 'Английский'],
      hourlyRate: 12000,
      rating: 4.9,
      reviewCount: 18,
      completedJobs: 25,
      successRate: 100,
      responseTime: 'within a day',
      city: 'Алматы',
      isVerified: true,
      isTopRated: false,
      memberSince: past(400),
      lastSeen: past(1),
      portfolio: [
        { title: 'Система рекомендаций для e-commerce', description: 'ML-модель увеличила средний чек на 23%', category: 'Data & AI', skills: ['Python', 'Machine Learning'] },
      ],
      completedWork: [
        { title: 'Чат-бот для службы поддержки', clientName: 'Клиент из Астаны', budget: 600000, duration: '3 недели', completedAt: past(50), rating: 5.0, review: 'Бот работает лучше ожидаемого.' },
      ],
    },
    {
      name: 'Мадина Сулейменова',
      title: 'Video Editor & Motion Designer',
      bio: 'Монтирую видео и создаю анимации для соцсетей, рекламы и корпоративных материалов. After Effects, Premiere Pro.',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=madina',
      skills: ['Video Editing', 'After Effects', 'Motion Design', 'Premiere Pro', 'Color Grading'],
      languages: ['Казахский', 'Русский'],
      hourlyRate: 4500,
      rating: 4.7,
      reviewCount: 41,
      completedJobs: 65,
      successRate: 98,
      responseTime: 'within an hour',
      city: 'Алматы',
      isVerified: true,
      isTopRated: false,
      memberSince: past(550),
      lastSeen: past(0),
      portfolio: [
        { title: 'Рекламный ролик для бренда одежды', description: '30-секундный ролик для Instagram', category: 'Video & Animation', skills: ['Premiere Pro', 'Color Grading'] },
      ],
      completedWork: [
        { title: 'Анимация для презентации стартапа', clientName: 'Клиент из Алматы', budget: 200000, duration: '1 неделя', completedAt: past(25), rating: 4.8, review: 'Красиво и профессионально.' },
      ],
    },
  ];
}
