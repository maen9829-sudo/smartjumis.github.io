import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto, UpdateProjectStatusDto } from './dto/update-project.dto';
import { ProjectStatus } from '@prisma/client';

// Which statuses a client can manually set
const ALLOWED_CLIENT_STATUS_TRANSITIONS: Partial<Record<ProjectStatus, ProjectStatus[]>> = {
  DRAFT:       ['OPEN', 'CANCELLED'],
  OPEN:        ['CANCELLED'],
  IN_REVIEW:   ['OPEN', 'CANCELLED'],   // re-open if not satisfied
  IN_PROGRESS: ['CANCELLED'],
};

// Fields to include in catalog listings (lightweight)
const PROJECT_CARD_SELECT = {
  id: true,
  title: true,
  description: true,
  budget: true,
  budgetType: true,
  deadline: true,
  status: true,
  skills: true,
  aiEnhanced: true,
  createdAt: true,
  category: { select: { id: true, name: true, nameRu: true, slug: true, icon: true } },
  client: { select: { id: true, name: true, avatarUrl: true, city: true } },
  _count: { select: { proposals: true, attachments: true } },
};

// Full detail for a single project page
const PROJECT_DETAIL_INCLUDE = {
  category: true,
  client: { select: { id: true, name: true, avatarUrl: true, city: true, createdAt: true } },
  attachments: {
    select: { id: true, fileName: true, fileUrl: true, fileSize: true, mimeType: true, createdAt: true },
  },
  proposals: {
    where: { status: 'PENDING' as const },
    include: {
      freelancer: {
        select: { id: true, name: true, avatarUrl: true, title: true, rating: true, reviewCount: true, city: true },
      },
    },
    orderBy: { createdAt: 'desc' as const },
  },
  order: {
    include: {
      freelancer: {
        select: { id: true, name: true, avatarUrl: true, title: true, rating: true },
      },
    },
  },
  _count: { select: { proposals: true, attachments: true } },
};

import { FreelancersService } from '../freelancers/freelancers.service';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private freelancersService: FreelancersService,
  ) {}

  // ─── Create project (saved as DRAFT) ─────────────────────────────────────
  async create(clientId: string, dto: CreateProjectDto) {
    // Verify category exists
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) throw new BadRequestException('Category not found');

    return this.prisma.project.create({
      data: {
        title:      dto.title,
        description: dto.description,
        budget:     dto.budget,
        budgetType: dto.budgetType ?? 'FIXED',
        deadline:   dto.deadline ? new Date(dto.deadline) : undefined,
        skills:     dto.skills,
        status:     'DRAFT',
        categoryId: dto.categoryId,
        clientId,
      },
      include: { category: true },
    });
  }

  // ─── Catalog: all OPEN projects with filters ──────────────────────────────
  async findAll(filters: {
    categorySlug?: string;
    search?: string;
    budgetMin?: number;
    budgetMax?: number;
    page?: number;
    limit?: number;
  }) {
    const { categorySlug, search, budgetMin, budgetMax, page = 1, limit = 12 } = filters;

    const where: any = { status: 'OPEN' };

    if (categorySlug) {
      const cat = await this.prisma.category.findUnique({ where: { slug: categorySlug } });
      if (cat) where.categoryId = cat.id;
    }
    if (search) {
      where.OR = [
        { title:       { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { skills:      { has: search } },
      ];
    }
    if (budgetMin || budgetMax) {
      where.budget = {};
      if (budgetMin) where.budget.gte = budgetMin;
      if (budgetMax) where.budget.lte = budgetMax;
    }

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        select: PROJECT_CARD_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  // ─── Single project detail page ───────────────────────────────────────────
  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: PROJECT_DETAIL_INCLUDE as any,
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  // ─── My projects (dashboard) ──────────────────────────────────────────────
  async findMyProjects(clientId: string, status?: ProjectStatus) {
    return this.prisma.project.findMany({
      where: {
        clientId,
        ...(status ? { status } : {}),
      },
      select: PROJECT_CARD_SELECT,
      orderBy: { updatedAt: 'desc' },
    });
  }

  // ─── Update project (owner only, only when DRAFT/OPEN) ───────────────────
  async update(id: string, clientId: string, dto: UpdateProjectDto) {
    const project = await this.findAndVerifyOwner(id, clientId);

    if (!['DRAFT', 'OPEN'].includes(project.status)) {
      throw new ForbiddenException('Cannot edit project with status: ' + project.status);
    }

    return this.prisma.project.update({
      where: { id },
      data: {
        ...dto,
        deadline: dto.deadline ? new Date(dto.deadline) : undefined,
      },
    });
  }

  // ─── Change project status ────────────────────────────────────────────────
  async updateStatus(id: string, clientId: string, dto: UpdateProjectStatusDto) {
    const project = await this.findAndVerifyOwner(id, clientId);

    const allowed = ALLOWED_CLIENT_STATUS_TRANSITIONS[project.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot change status from ${project.status} to ${dto.status}`,
      );
    }

    const updatedProject = await this.prisma.project.update({
      where: { id },
      data: { status: dto.status },
    });

    // If published, trigger fake proposals in background
    if (dto.status === 'OPEN') {
      // Don't await, let it run in background to simulate delays or just not block request
      this.freelancersService.autoPropose(id, project.categoryId).catch(console.error);
    }

    return updatedProject;
  }

  // ─── Delete project (owner, only DRAFT) ──────────────────────────────────
  async delete(id: string, clientId: string) {
    const project = await this.findAndVerifyOwner(id, clientId);

    if (project.status !== 'DRAFT') {
      throw new ForbiddenException('Only draft projects can be deleted');
    }

    return this.prisma.project.delete({ where: { id } });
  }

  // ─── Private helpers ──────────────────────────────────────────────────────
  private async findAndVerifyOwner(id: string, clientId: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');
    if (project.clientId !== clientId) throw new ForbiddenException();
    return project;
  }
}
