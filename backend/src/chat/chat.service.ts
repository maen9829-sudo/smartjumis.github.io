import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  // Get all chat rooms for a client
  async getMyRooms(clientId: string) {
    return this.prisma.chatRoom.findMany({
      where: { clientId },
      include: {
        freelancer: { select: { id: true, name: true, avatarUrl: true, isVerified: true } },
        project: { select: { id: true, title: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Get the latest message for the list preview
        },
        _count: {
          select: {
            messages: { where: { isRead: false, senderType: 'freelancer' } }, // unread messages sent by freelancer
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get messages for a specific room
  async getRoomMessages(roomId: string, clientId: string) {
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) throw new NotFoundException('Chat room not found');
    if (room.clientId !== clientId) throw new ForbiddenException();

    // Mark all unread messages as read when opening the room
    await this.prisma.message.updateMany({
      where: { chatRoomId: roomId, senderType: 'freelancer', isRead: false },
      data: { isRead: true },
    });

    return this.prisma.message.findMany({
      where: { chatRoomId: roomId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // Save a message sent via WebSocket or REST
  async saveMessage(data: {
    chatRoomId: string;
    senderId: string;
    senderType: string;
    content: string;
    fileUrl?: string;
    fileName?: string;
  }) {
    return this.prisma.message.create({
      data: {
        chatRoomId: data.chatRoomId,
        senderId: data.senderId,
        senderType: data.senderType,
        content: data.content,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
      },
    });
  }
}
