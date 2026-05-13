import { Controller, Post, Body, UseGuards, Param, Get } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  // POST /api/ai/enhance-project
  // Client uses this while creating a project draft
  @Post('enhance-project')
  enhanceProject(@Body() body: { title: string; description: string }) {
    return this.aiService.enhanceProject(body.title, body.description);
  }

  // POST /api/ai/suggest-category
  @Post('suggest-category')
  suggestCategory(@Body() body: { title: string; description: string }) {
    return this.aiService.suggestCategory(body.title, body.description);
  }

  // POST /api/ai/generate-proposal
  // Freelancer uses this to draft a proposal text
  @Post('generate-proposal')
  generateProposal(@Body() body: { freelancerData: any; projectData: any }) {
    return this.aiService.generateProposal(body.freelancerData, body.projectData);
  }

  // GET /api/ai/match-freelancers/:projectId
  // Client uses this to see top recommended freelancers for their project
  @Get('match-freelancers/:projectId')
  matchFreelancers(@Param('projectId') projectId: string) {
    return this.aiService.matchFreelancers(projectId);
  }
}
