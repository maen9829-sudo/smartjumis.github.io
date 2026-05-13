import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  // POST /api/reviews/orders/:orderId
  // Leave a review for a completed order
  @UseGuards(JwtAuthGuard)
  @Post('orders/:orderId')
  create(
    @Param('orderId') orderId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(orderId, user.id, dto);
  }

  // GET /api/reviews/freelancers/:freelancerId  (public)
  // Show reviews on a freelancer profile page
  @Get('freelancers/:freelancerId')
  findByFreelancer(@Param('freelancerId') freelancerId: string) {
    return this.reviewsService.findByFreelancer(freelancerId);
  }
}
