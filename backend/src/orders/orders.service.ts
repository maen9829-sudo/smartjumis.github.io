import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateOrderStatusDto } from './dto/update-order.dto';

// Full order detail include
const ORDER_DETAIL_INCLUDE = {
  project: {
    select: {
      id: true, title: true, description: true,
      budget: true, budgetType: true, categoryId: true,
      category: { select: { name: true, nameRu: true, slug: true, icon: true } },
    },
  },
  freelancer: {
    select: {
      id: true, name: true, avatarUrl: true,
      title: true, rating: true, reviewCount: true, city: true,
    },
  },
  proposal: {
    select: { id: true, coverLetter: true, price: true, deliveryDays: true },
  },
  review: true,
};

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  // ─── Get all orders for current client ───────────────────────────────────
  async findMyOrders(clientId: string, status?: string) {
    return this.prisma.order.findMany({
      where: {
        project: { clientId },
        ...(status ? { status: status as any } : {}),
      },
      include: {
        project: {
          select: { id: true, title: true, category: { select: { name: true, nameRu: true, icon: true } } },
        },
        freelancer: {
          select: { id: true, name: true, avatarUrl: true, title: true, rating: true },
        },
        review: { select: { id: true, rating: true } },
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  // ─── Get single order detail ──────────────────────────────────────────────
  async findOne(orderId: string, clientId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: ORDER_DETAIL_INCLUDE,
    });

    if (!order) throw new NotFoundException('Order not found');

    // Only the project owner can view order details
    const project = await this.prisma.project.findUnique({
      where: { id: order.projectId },
    });
    if (project?.clientId !== clientId) throw new ForbiddenException();

    return order;
  }

  // ─── Update order status (client side: COMPLETED | CANCELLED | DISPUTED) ─
  async updateStatus(orderId: string, clientId: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { project: { select: { clientId: true } } },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.project.clientId !== clientId) throw new ForbiddenException();

    // Validate transition
    this.validateTransition(order.status, dto.status);

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status:      dto.status,
        cancelReason: dto.cancelReason,
        completedAt: dto.status === 'COMPLETED' ? new Date() : undefined,
      },
    });

    // When COMPLETED — sync project status and send notification
    if (dto.status === 'COMPLETED') {
      await Promise.all([
        this.prisma.project.update({
          where: { id: order.projectId },
          data: { status: 'COMPLETED' },
        }),
        this.prisma.notification.create({
          data: {
            userId: clientId,
            type: 'order_completed',
            text: 'Заказ завершён. Оставьте отзыв фрилансеру.',
            link: `/dashboard/orders/${orderId}`,
          },
        }),
      ]);
    }

    return updatedOrder;
  }

  // ─── Mark as DELIVERED (simulated — called by admin/system for fake freelancers) ─
  async markDelivered(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    if (order.status !== 'ACTIVE') {
      throw new BadRequestException('Only ACTIVE orders can be delivered');
    }

    const [updatedOrder] = await Promise.all([
      this.prisma.order.update({
        where: { id: orderId },
        data: { status: 'DELIVERED' },
      }),
      // Notify client that work is ready for review
      this.prisma.project.update({
        where: { id: order.projectId },
        data: {},
        // project status stays IN_PROGRESS until client accepts
      }),
    ]);

    // Find project to get clientId for notification
    const project = await this.prisma.project.findUnique({
      where: { id: order.projectId },
    });
    if (project) {
      await this.prisma.notification.create({
        data: {
          userId: project.clientId,
          type: 'order_delivered',
          text: 'Фрилансер отметил работу как выполненную. Проверьте и примите.',
          link: `/dashboard/orders/${orderId}`,
        },
      });
    }

    return updatedOrder;
  }

  // ─── Status machine validation ────────────────────────────────────────────
  private validateTransition(current: string, next: string) {
    const allowed: Record<string, string[]> = {
      ACTIVE:    ['CANCELLED', 'DISPUTED'],
      DELIVERED: ['COMPLETED', 'CANCELLED', 'DISPUTED'],
      DISPUTED:  ['COMPLETED', 'CANCELLED'],
    };

    if (!allowed[current]?.includes(next)) {
      throw new BadRequestException(
        `Cannot transition order from ${current} to ${next}`,
      );
    }
  }
}
