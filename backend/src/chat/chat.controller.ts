import { Controller, Get, Param, UseGuards, Post, Body } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ChatGateway } from './chat.gateway';

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(
    private chatService: ChatService,
    private chatGateway: ChatGateway,
  ) {}

  // GET /api/chat/rooms
  @Get('rooms')
  getMyRooms(@CurrentUser() user: { id: string }) {
    return this.chatService.getMyRooms(user.id);
  }

  // GET /api/chat/rooms/:id/messages
  @Get('rooms/:id/messages')
  getRoomMessages(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.chatService.getRoomMessages(id, user.id);
  }

  // POST /api/chat/rooms/:id/simulate-reply
  // Utility endpoint to trigger a fake reply from a freelancer (for MVP demo purposes)
  @Post('rooms/:id/simulate-reply')
  simulateReply(
    @Param('id') roomId: string,
    @Body() body: { freelancerId: string; content: string }
  ) {
    return this.chatGateway.simulateFreelancerReply(roomId, body.freelancerId, body.content);
  }
}
