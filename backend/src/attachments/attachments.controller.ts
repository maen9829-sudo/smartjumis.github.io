import { Controller, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AttachmentsService } from './attachments.service';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/attachments')
export class AttachmentsController {
  constructor(private attachmentsService: AttachmentsService) {}

  // POST /api/projects/:projectId/attachments
  // Frontend: upload to Supabase → get URL → call this endpoint with metadata
  @Post()
  add(
    @Param('projectId') projectId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CreateAttachmentDto,
  ) {
    return this.attachmentsService.addToProject(projectId, user.id, dto);
  }

  // DELETE /api/projects/:projectId/attachments/:id
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.attachmentsService.remove(id, user.id);
  }
}
