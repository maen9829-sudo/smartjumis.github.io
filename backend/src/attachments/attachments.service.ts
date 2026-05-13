import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAttachmentDto } from './dto/create-attachment.dto';

const MAX_ATTACHMENTS_PER_PROJECT = 10;

@Injectable()
export class AttachmentsService {
  constructor(private prisma: PrismaService) {}

  // Add attachment metadata to a project (owner only)
  async addToProject(projectId: string, clientId: string, dto: CreateAttachmentDto) {
    // Verify project exists and belongs to client
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');
    if (project.clientId !== clientId) throw new ForbiddenException();

    // Check attachment count limit
    const count = await this.prisma.attachment.count({ where: { projectId } });
    if (count >= MAX_ATTACHMENTS_PER_PROJECT) {
      throw new BadRequestException(`Max ${MAX_ATTACHMENTS_PER_PROJECT} attachments per project`);
    }

    return this.prisma.attachment.create({
      data: { ...dto, projectId },
    });
  }

  // Remove attachment (owner only)
  async remove(attachmentId: string, clientId: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { project: { select: { clientId: true } } },
    });

    if (!attachment) throw new NotFoundException('Attachment not found');
    if (attachment.project.clientId !== clientId) throw new ForbiddenException();

    return this.prisma.attachment.delete({ where: { id: attachmentId } });
  }
}
