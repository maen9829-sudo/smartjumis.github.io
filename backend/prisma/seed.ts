import { PrismaClient } from '@prisma/client';

import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Categories
  console.log('Creating categories...');
  const categoriesData = [
    { name: 'Web Development', nameRu: 'Веб-разработка', nameKk: 'Веб-әзірлеу', slug: 'web-development', icon: 'Code' },
    { name: 'Mobile App Development', nameRu: 'Мобильная разработка', nameKk: 'Мобильді әзірлеу', slug: 'mobile-development', icon: 'Smartphone' },
    { name: 'UI/UX Design', nameRu: 'UI/UX Дизайн', nameKk: 'UI/UX Дизайн', slug: 'ui-ux-design', icon: 'Palette' },
    { name: 'Digital Marketing', nameRu: 'Digital Маркетинг', nameKk: 'Цифрлық маркетинг', slug: 'digital-marketing', icon: 'TrendingUp' },
    { name: 'Data Science & AI', nameRu: 'Data Science и ИИ', nameKk: 'Data Science және ЖИ', slug: 'data-science', icon: 'Database' },
    { name: 'Video & Animation', nameRu: 'Видео и Анимация', nameKk: 'Видео және Анимация', slug: 'video-animation', icon: 'Video' },
    { name: 'Writing & Translation', nameRu: 'Тексты и Переводы', nameKk: 'Мәтіндер мен аудармалар', slug: 'writing-translation', icon: 'Type' },
  ];

  const categories: any[] = [];
  for (const cat of categoriesData) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
    categories.push(created);
  }

  // 2. Freelancers, Portfolios, and CompletedWork
  console.log('Creating freelancers...');
  const past = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  };

  const freelancersData = [
    {
      name: 'Алибек Сейткали',
      title: 'Senior Full-Stack Developer',
      bio: 'Разрабатываю масштабируемые веб-приложения. React, Next.js, Node.js, PostgreSQL. Более 6 лет опыта.',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alibek',
      skills: ['React', 'Next.js', 'Node.js', 'PostgreSQL', 'TypeScript'],
      languages: ['Казахский', 'Русский', 'Английский'],
      hourlyRate: 8500,
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
        { title: 'E-commerce платформа', description: 'Полноценный интернет-магазин с корзиной и оплатой', category: 'Web Development', skills: ['Next.js', 'Node.js', 'Stripe'] },
        { title: 'CRM система для логистики', description: 'Управление заказами и складом в реальном времени', category: 'Web Development', skills: ['React', 'PostgreSQL'] },
      ],
      completedWork: [
        { title: 'Разработка сайта для ресторана', clientName: 'Клиент из Алматы', budget: 350000, duration: '2 недели', completedAt: past(30), rating: 5.0, review: 'Отличная работа, всё сделал в срок!' },
        { title: 'B2B Маркетплейс', clientName: 'Клиент из Астаны', budget: 1500000, duration: '2 месяца', completedAt: past(120), rating: 4.8, review: 'Профессионально, рекомендую.' },
      ],
    },
    {
      name: 'Дина Жаксыбекова',
      title: 'Lead UI/UX Designer',
      bio: 'Создаю интерфейсы, которыми приятно пользоваться. Специализируюсь на SaaS и мобильных приложениях. Figma, User Research.',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dina',
      skills: ['Figma', 'UI Design', 'UX Research', 'Prototyping', 'Design Systems'],
      languages: ['Казахский', 'Русский', 'Английский'],
      hourlyRate: 6500,
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
        { title: 'Дизайн приложения для доставки', description: 'Мобильное приложение с онбордингом и картой', category: 'UI/UX Design', skills: ['Figma', 'Mobile Design'] },
      ],
      completedWork: [
        { title: 'Дизайн лендинга для AI стартапа', clientName: 'Клиент из Алматы', budget: 180000, duration: '1 неделя', completedAt: past(20), rating: 5.0, review: 'Дина — лучший дизайнер с кем я работал! Очень современный вкус.' },
      ],
    },
    {
      name: 'Ерлан Байжанов',
      title: 'Mobile App Developer',
      bio: 'Кроссплатформенная разработка iOS и Android. React Native, Flutter.',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=erlan',
      skills: ['React Native', 'Flutter', 'iOS', 'Android', 'Firebase'],
      languages: ['Казахский', 'Русский'],
      hourlyRate: 9000,
      rating: 4.7,
      reviewCount: 29,
      completedJobs: 42,
      successRate: 95,
      responseTime: 'within a day',
      city: 'Шымкент',
      isVerified: true,
      isTopRated: false,
      memberSince: past(500),
      lastSeen: past(2),
      portfolio: [
        { title: 'Фитнес-приложение', description: 'Трекер активности с интеграцией HealthKit', category: 'Mobile App Development', skills: ['React Native', 'Firebase'] },
      ],
      completedWork: [
        { title: 'Приложение для онлайн-обучения', clientName: 'Клиент из Алматы', budget: 800000, duration: '6 недель', completedAt: past(45), rating: 5.0, review: 'Идеально! Всё работает отлично без багов.' },
      ],
    },
    {
      name: 'Асхат Темиров',
      title: 'AI Engineer & Data Scientist',
      bio: 'Внедряю ИИ в ваш бизнес. Работаю с OpenAI API, LangChain, TensorFlow.',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=askhat',
      skills: ['Python', 'OpenAI', 'Machine Learning', 'Data Analysis', 'LangChain'],
      languages: ['Русский', 'Английский'],
      hourlyRate: 12000,
      rating: 5.0,
      reviewCount: 15,
      completedJobs: 20,
      successRate: 100,
      responseTime: 'within an hour',
      city: 'Алматы',
      isVerified: true,
      isTopRated: true,
      memberSince: past(300),
      lastSeen: past(0),
      portfolio: [
        { title: 'Чат-бот поддержка', description: 'Бот на базе ChatGPT для интернет-магазина', category: 'Data Science & AI', skills: ['Python', 'OpenAI'] },
      ],
      completedWork: [
        { title: 'Система рекомендаций', clientName: 'Клиент из Астаны', budget: 600000, duration: '3 недели', completedAt: past(15), rating: 5.0, review: 'Сделал бота, который разгрузил саппорт на 40%.' },
      ],
    }
  ];

  const freelancers: any[] = [];
  for (const data of freelancersData) {
    const { portfolio, completedWork, ...flData } = data;
    let freelancer = await prisma.freelancer.findFirst({ where: { name: flData.name } });
    
    if (!freelancer) {
      freelancer = await prisma.freelancer.create({ data: flData });
      
      // Portfolios
      if (portfolio.length > 0) {
        await prisma.portfolioItem.createMany({
          data: portfolio.map(p => ({ ...p, freelancerId: freelancer!.id }))
        });
      }
      
      // Completed Work
      if (completedWork.length > 0) {
        await prisma.completedWork.createMany({
          data: completedWork.map(c => ({ ...c, freelancerId: freelancer!.id }))
        });
      }
    }
    freelancers.push(freelancer);
  }

  // 3. Fake Client User (to own the catalog projects)
  console.log('Creating fake client and projects...');
  const fakeClient = await prisma.user.upsert({
    where: { email: 'client@example.com' },
    update: {},
    create: {
      email: 'client@example.com',
      passwordHash: 'seeded',
      name: 'Startup Founder',
      city: 'Алматы',
    }
  });

  // 4. Seed 3 Active Projects for the Catalog
  const projectsData = [
    {
      title: 'Разработать AI чат-бота для Telegram',
      description: 'Нужен бот на Python, который будет консультировать клиентов по ассортименту магазина используя OpenAI API. Оплата сдельная.',
      budget: 200000,
      budgetType: 'FIXED' as const,
      status: 'OPEN' as const,
      categoryId: categories.find(c => c.slug === 'data-science')!.id,
      clientId: fakeClient.id,
      skills: ['Python', 'OpenAI', 'Telegram API'],
    },
    {
      title: 'Сделать дизайн мобильного приложения (Финтех)',
      description: 'Ищем опытного UI/UX дизайнера для редизайна финансового приложения. Около 15 экранов. Нужно сделать современно, в стиле неоморфизма или глассморфизма.',
      budget: 350000,
      budgetType: 'FIXED' as const,
      status: 'OPEN' as const,
      categoryId: categories.find(c => c.slug === 'ui-ux-design')!.id,
      clientId: fakeClient.id,
      skills: ['Figma', 'UI Design', 'Mobile Design'],
    },
    {
      title: 'Frontend разработчик (React/Next.js) на почасовку',
      description: 'Нужен мидл/сеньор для доработки дашборда B2B платформы. Стек: Next.js, Tailwind, Zustand. Ожидаемая занятость 20 часов в неделю.',
      budget: 6000,
      budgetType: 'HOURLY' as const,
      status: 'OPEN' as const,
      categoryId: categories.find(c => c.slug === 'web-development')!.id,
      clientId: fakeClient.id,
      skills: ['React', 'Next.js', 'TailwindCSS'],
    }
  ];

  for (const projData of projectsData) {
    const project = await prisma.project.create({ data: projData });

    // 5. Seed Fake Proposals for these projects
    // Find freelancers whose skills match
    const matchingFreelancers = freelancers.filter(f => 
      f.skills.some(skill => projData.skills.includes(skill))
    );

    for (const freelancer of matchingFreelancers) {
      const price = projData.budgetType === 'FIXED' 
        ? Math.round(projData.budget * 0.9) 
        : freelancer.hourlyRate * 20;

      await prisma.proposal.create({
        data: {
          coverLetter: `Здравствуйте! Меня заинтересовал ваш проект "${projData.title}". Я имею опыт с ${projData.skills.join(', ')} и готов приступить к задаче. Мое портфолио говорит само за себя. Давайте обсудим детали.`,
          price,
          deliveryDays: projData.budgetType === 'FIXED' ? 14 : 30,
          projectId: project.id,
          freelancerId: freelancer.id,
          status: 'PENDING',
        }
      });
    }
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
