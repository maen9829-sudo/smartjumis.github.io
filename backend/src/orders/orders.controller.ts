import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { UpdateOrderStatusDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  // GET /api/orders?status=ACTIVE
  // Returns all orders for the current client
  @Get()
  findMyOrders(
    @CurrentUser() user: { id: string },
    @Query('status') status?: string,
  ) {
    return this.ordersService.findMyOrders(user.id, status);
  }

  // GET /api/orders/:id
  // Full order detail — project, freelancer, proposal, review
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.ordersService.findOne(id, user.id);
  }

  // PATCH /api/orders/:id/status
  // Client actions: COMPLETED | CANCELLED | DISPUTED
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, user.id, dto);
  }

  // PATCH /api/orders/:id/deliver
  // Internal/admin: mark order as DELIVERED (simulating fake freelancer action)
  @Patch(':id/deliver')
  markDelivered(@Param('id') id: string) {
    return this.ordersService.markDelivered(id);
  }
}
