import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { ProjectsModule } from './projects/projects.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { FreelancersModule } from './freelancers/freelancers.module';
import { ProposalsModule } from './proposals/proposals.module';
import { OrdersModule } from './orders/orders.module';
import { ReviewsModule } from './reviews/reviews.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ChatModule } from './chat/chat.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    // Env variables (must be first)
    ConfigModule.forRoot({ isGlobal: true }),

    // Rate limiting — prevents brute force on auth endpoints
    // 100 requests per 60 seconds per IP
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),

    // Database
    PrismaModule,

    // Auth & Users
    AuthModule,
    UsersModule,

    // Business features
    CategoriesModule,
    ProjectsModule,
    AttachmentsModule,
    FreelancersModule,
    ProposalsModule,
    OrdersModule,
    ReviewsModule,
    NotificationsModule,
    ChatModule,
    AiModule,
  ],

  providers: [
    // Apply rate limiting globally across all routes
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
