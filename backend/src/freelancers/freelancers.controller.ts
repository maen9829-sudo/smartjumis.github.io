import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { FreelancersService } from './freelancers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/guards/jwt-auth.guard';

@Controller('freelancers')
export class FreelancersController {
  constructor(private freelancersService: FreelancersService) {}

  // GET /api/freelancers?search=...&skill=...&page=1
  @Public()
  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('skill') skill?: string,
    @Query('minRate') minRate?: string,
    @Query('maxRate') maxRate?: string,
    @Query('isTopRated') isTopRated?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.freelancersService.findAll({
      search,
      skill,
      minRate: minRate ? Number(minRate) : undefined,
      maxRate: maxRate ? Number(maxRate) : undefined,
      isTopRated: isTopRated === 'true',
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  // GET /api/freelancers/featured  (top 6 for landing page)
  @Public()
  @Get('featured')
  findFeatured() {
    return this.freelancersService.findFeatured();
  }

  // POST /api/freelancers/seed  (Admin only)
  @UseGuards(JwtAuthGuard)
  @Post('seed')
  seed() {
    return this.freelancersService.seed();
  }

  // GET /api/freelancers/:id
  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.freelancersService.findOne(id);
  }
}
