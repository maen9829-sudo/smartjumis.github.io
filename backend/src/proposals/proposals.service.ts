import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProposalsService {
  constructor(private prisma: PrismaService) {}

  // ─── Get proposals for a project (project owner only) ────────────────────
  async findByProject(projectId: string, clientId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');
    if (project.clientId !== clientId) throw new ForbiddenException();

    return this.prisma.proposal.findMany({
      where: { projectId },
      include: {
        freelancer: {
          select: {
            id: true, name: true, avatarUrl: true, title: true,
            rating: true, reviewCount: true, hourlyRate: true, city: true,
            skills: true, bio: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Accept a proposal → automatically creates an Order ──────────────────
  async accept(proposalId: string, clientId: string) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { id: proposalId },
      include: { project: true },
    });

    if (!proposal) throw new NotFoundException('Proposal not found');
    if (proposal.project.clientId !== clientId) throw new ForbiddenException();
    if (proposal.status !== 'PENDING') {
      throw new BadRequestException('Proposal is already processed');
    }
    if (proposal.project.status !== 'OPEN' && proposal.project.status !== 'IN_REVIEW') {
      throw new BadRequestException('Project is not accepting proposals');
    }

    // Calculate order deadline
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + proposal.deliveryDays);

    // Use a transaction: accept proposal + reject others + create order + update project
    const [, , order] = await this.prisma.$transaction([
      // 1. Accept this proposal
      this.prisma.proposal.update({
        where: { id: proposalId },
        data: { status: 'ACCEPTED' },
      }),

      // 2. Reject all other PENDING proposals for the same project
      this.prisma.proposal.updateMany({
        where: {
          projectId: proposal.projectId,
          id: { not: proposalId },
          status: 'PENDING',
        },
        data: { status: 'REJECTED' },
      }),

      // 3. Create the Order
      this.prisma.order.create({
        data: {
          agreedPrice:  proposal.price,
          deliveryDays: proposal.deliveryDays,
          deadline,
          status:       'ACTIVE',
          projectId:    proposal.projectId,
          proposalId,
          freelancerId: proposal.freelancerId,
        },
        include: {
          freelancer: { select: { id: true, name: true, avatarUrl: true, title: true } },
          project:    { select: { id: true, title: true } },
        },
      }),

      // 4. Update project status to IN_PROGRESS
      this.prisma.project.update({
        where: { id: proposal.projectId },
        data: { status: 'IN_PROGRESS' },
      }),

      // 5. Create a ChatRoom between client and freelancer
      this.prisma.chatRoom.upsert({
        where: { projectId: proposal.projectId },
        update: {},
        create: {
          projectId:    proposal.projectId,
          clientId,
          freelancerId: proposal.freelancerId,
        },
      }),

      // 6. Notify the client
      this.prisma.notification.create({
        data: {
          userId: clientId,
          type:   'proposal_accepted',
          text:   `Вы приняли предложение. Заказ создан!`,
          link:   `/dashboard/orders`,
        },
      }),
    ]);

    return order;
  }

  // ─── Reject a proposal ────────────────────────────────────────────────────
  async reject(proposalId: string, clientId: string) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { id: proposalId },
      include: { project: { select: { clientId: true } } },
    });

    if (!proposal) throw new NotFoundException('Proposal not found');
    if (proposal.project.clientId !== clientId) throw new ForbiddenException();
    if (proposal.status !== 'PENDING') {
      throw new BadRequestException('Proposal is already processed');
    }

    return this.prisma.proposal.update({
      where: { id: proposalId },
      data: { status: 'REJECTED' },
    });
  }
}
