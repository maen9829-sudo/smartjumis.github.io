import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    this.openai = new OpenAI({ apiKey });
  }

  // 1. Enhance project description (Grammar, structure, skill extraction)
  async enhanceProject(title: string, description: string) {
    try {
      const prompt = `You are an expert IT project manager.
A client has written a rough project description.
Title: "${title}"
Description: "${description}"

Improve the description to be professional, clear, and structured (use markdown).
Also extract 3-5 key technical skills required for this project.

Output ONLY a JSON object with this format, nothing else:
{
  "enhancedTitle": "Better Title",
  "enhancedDescription": "Structured markdown...",
  "suggestedSkills": ["Skill 1", "Skill 2"]
}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini', // Cost-effective model for MVP
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      throw new InternalServerErrorException('Failed to enhance project');
    }
  }

  // 2. Suggest category based on text
  async suggestCategory(title: string, description: string) {
    // Get available categories from DB
    const categories = await this.prisma.category.findMany({ select: { slug: true, name: true } });
    const categoryList = categories.map(c => `${c.name} (${c.slug})`).join(', ');

    const prompt = `Based on this project:
Title: "${title}"
Description: "${description}"

Which of these categories fits best?
Categories: [${categoryList}]

Output ONLY a JSON object:
{ "suggestedSlug": "the-slug-here" }`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }

  // 3. Generate a tailored proposal cover letter
  async generateProposal(freelancerData: any, projectData: any) {
    const prompt = `Write a professional proposal (cover letter) from a freelancer to a client.
Freelancer Name: ${freelancerData.name}
Freelancer Title: ${freelancerData.title}
Freelancer Bio: ${freelancerData.bio}

Project Title: ${projectData.title}
Project Description: ${projectData.description}

Write in Russian (or Kazakh if requested). Make it concise, polite, and highlight why the freelancer's specific skills match the project.
Output ONLY the cover letter text, no json.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    return { coverLetter: response.choices[0].message.content };
  }

  // 4. Simple matching logic: Find best freelancers for a project
  async matchFreelancers(projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new Error('Project not found');

    // Get all top rated / active freelancers (limit to 20 for prompt size optimization)
    const freelancers = await this.prisma.freelancer.findMany({
      where: { isActive: true },
      select: { id: true, name: true, title: true, skills: true },
      take: 20,
    });

    const prompt = `You are an AI Matchmaker. Find the 3 best freelancers for this project.
Project: ${project.title}
Required Skills: ${project.skills.join(', ')}

Available Freelancers:
${JSON.stringify(freelancers)}

Output ONLY a JSON object:
{
  "matches": [
    { "freelancerId": "id", "reason": "Short reason why they match" }
  ]
}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.4,
    });

    const parsed = JSON.parse(response.choices[0].message.content || '{"matches":[]}');
    
    // Fetch full profiles for the matched IDs
    const matchedIds = parsed.matches.map((m: any) => m.freelancerId);
    const matchedProfiles = await this.prisma.freelancer.findMany({
      where: { id: { in: matchedIds } },
      select: { id: true, name: true, avatarUrl: true, title: true, rating: true, hourlyRate: true }
    });

    // Merge reasons
    const result = matchedProfiles.map(profile => ({
      ...profile,
      matchReason: parsed.matches.find((m: any) => m.freelancerId === profile.id)?.reason
    }));

    return result;
  }
}
