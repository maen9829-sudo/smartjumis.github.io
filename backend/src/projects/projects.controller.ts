import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  Optional,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto, UpdateProjectStatusDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ProjectStatus } from '@prisma/client';

@Controller('projects')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  // ─── Public catalog ────────────────────────────────────────────────────────
  // GET /api/projects?category=web-development&search=react&budgetMin=50000&page=1
  @Get()
  findAll(
    @Query('category')  categorySlug?: string,
    @Query('search')    search?: string,
    @Query('budgetMin') budgetMin?: string,
    @Query('budgetMax') budgetMax?: string,
    @Query('page')      page?: string,
    @Query('limit')     limit?: string,
  ) {
    return this.projectsService.findAll({
      categorySlug,
      search,
      budgetMin: budgetMin ? Number(budgetMin) : undefined,
      budgetMax: budgetMax ? Number(budgetMax) : undefined,
      page:      page  ? Number(page)  : 1,
      limit:     limit ? Number(limit) : 12,
    });
  }

  // ─── Auth-protected routes ─────────────────────────────────────────────────
  // GET /api/projects/my?status=OPEN
  @UseGuards(JwtAuthGuard)
  @Get('my')
  findMyProjects(
    @CurrentUser() user: { id: string },
    @Query('status') status?: ProjectStatus,
  ) {
    return this.projectsService.findMyProjects(user.id, status);
  }

  // GET /api/projects/:id  (public — detail page)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  // POST /api/projects  → creates as DRAFT
  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectsService.create(user.id, dto);
  }

  // PATCH /api/projects/:id  → update content (title, description, etc.)
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, user.id, dto);
  }

  // PATCH /api/projects/:id/status  → publish, cancel, etc.
  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateProjectStatusDto,
  ) {
    return this.projectsService.updateStatus(id, user.id, dto);
  }

  // DELETE /api/projects/:id  → only DRAFT projects
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  delete(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.projectsService.delete(id, user.id);
  }
}
