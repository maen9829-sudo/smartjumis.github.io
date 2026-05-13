import { Controller, Get, Post, Query, Param, UseGuards } from '@nestjs/common';
import { ProposalsService } from './proposals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('proposals')
export class ProposalsController {
  constructor(private proposalsService: ProposalsService) {}

  // GET /api/proposals?projectId=xxx
  @Get()
  findByProject(
    @Query('projectId') projectId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.proposalsService.findByProject(projectId, user.id);
  }

  // POST /api/proposals/:id/accept  → creates Order
  @Post(':id/accept')
  accept(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.proposalsService.accept(id, user.id);
  }

  // POST /api/proposals/:id/reject
  @Post(':id/reject')
  reject(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.proposalsService.reject(id, user.id);
  }
}
