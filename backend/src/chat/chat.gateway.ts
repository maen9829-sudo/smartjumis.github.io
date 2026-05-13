import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: '*', // Allow all for MVP, restrict to frontend URL in production
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Track online users mapping userId -> socketId
  private activeUsers = new Map<string, string>();

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
  ) {}

  // Handle connection and simple JWT authentication
  async handleConnection(socket: Socket) {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers['authorization']?.split(' ')[1];
      if (!token) throw new Error('No token');

      // Verify token
      const decoded = this.jwtService.verify(token);
      const userId = decoded.sub;

      // Store userId in socket and add to active users
      socket.data.userId = userId;
      this.activeUsers.set(userId, socket.id);

      // Broadcast online status to others
      this.server.emit('user_status', { userId, status: 'online' });
      
    } catch (error) {
      socket.disconnect();
    }
  }

  handleDisconnect(socket: Socket) {
    const userId = socket.data.userId;
    if (userId) {
      this.activeUsers.delete(userId);
      this.server.emit('user_status', { userId, status: 'offline' });
    }
  }

  // Client joins a specific room to receive messages
  @SubscribeMessage('join_room')
  handleJoinRoom(@ConnectedSocket() socket: Socket, @MessageBody() roomId: string) {
    socket.join(roomId);
  }

  // Client sends a new message
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: { roomId: string; content: string; fileUrl?: string; fileName?: string },
  ) {
    const userId = socket.data.userId;
    if (!userId) return;

    // Save message to DB
    const message = await this.chatService.saveMessage({
      chatRoomId: payload.roomId,
      senderId: userId,
      senderType: 'client', // in this MVP, authenticated user is always the client
      content: payload.content,
      fileUrl: payload.fileUrl,
      fileName: payload.fileName,
    });

    // Broadcast to everyone in the room (including sender to confirm receipt)
    this.server.to(payload.roomId).emit('new_message', message);
    
    // Also emit a notification event to the room so unread counts can update globally
    this.server.to(payload.roomId).emit('notification', { type: 'new_message', message });
  }

  // Method to simulate fake freelancer replying (called by other services or admin endpoint)
  async simulateFreelancerReply(roomId: string, freelancerId: string, content: string) {
    const message = await this.chatService.saveMessage({
      chatRoomId: roomId,
      senderId: freelancerId,
      senderType: 'freelancer',
      content,
    });

    this.server.to(roomId).emit('new_message', message);
    this.server.to(roomId).emit('notification', { type: 'new_message', message });
    return message;
  }
}
