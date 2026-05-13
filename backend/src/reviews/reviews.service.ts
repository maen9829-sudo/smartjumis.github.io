import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  // ─── Leave review after order completion ──────────────────────────────────
  async create(orderId: string, clientId: string, dto: CreateReviewDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { project: { select: { clientId: true } } },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.project.clientId !== clientId) throw new ForbiddenException();
    if (order.status !== 'COMPLETED') {
      throw new ForbiddenException('Can only review completed orders');
    }

    // Check if review already exists
    const existingReview = await this.prisma.review.findUnique({ where: { orderId } });
    if (existingReview) throw new ConflictException('Review already exists for this order');

    // Create review + update freelancer rating in one transaction
    const [review] = await this.prisma.$transaction(async (tx) => {
      // Create the review
      const newReview = await tx.review.create({
        data: {
          orderId,
          rating:      dto.rating,
          comment:     dto.comment,
          freelancerId: order.freelancerId,
          clientId,
        },
      });

      // Recalculate freelancer average rating
      const allReviews = await tx.review.findMany({
        where: { freelancerId: order.freelancerId },
        select: { rating: true },
      });

      const avgRating =
        allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

      // Update freelancer stats
      await tx.freelancer.update({
        where: { id: order.freelancerId },
        data: {
          rating:      Math.round(avgRating * 10) / 10, // round to 1 decimal
          reviewCount: allReviews.length,
        },
      });

      return [newReview];
    });

    return review;
  }

  // ─── Get reviews for a freelancer (public) ────────────────────────────────
  async findByFreelancer(freelancerId: string) {
    return this.prisma.review.findMany({
      where: { freelancerId },
      include: {
        client:  { select: { id: true, name: true, avatarUrl: true } },
        order:   { include: { project: { select: { id: true, title: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
