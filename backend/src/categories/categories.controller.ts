import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  // GET /api/categories  (public)
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  // GET /api/categories/:slug  (public)
  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  // POST /api/categories/seed  (admin only — seed initial data)
  @UseGuards(JwtAuthGuard)
  @Post('seed')
  seed() {
    return this.categoriesService.seed();
  }
}
