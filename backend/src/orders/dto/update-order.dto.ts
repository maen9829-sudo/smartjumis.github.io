import { IsEnum, IsString, IsOptional } from 'class-validator';
import { OrderStatus } from '@prisma/client';

// Client changes order status (deliver, complete, cancel, dispute)
export class UpdateOrderStatusDto {
  @IsEnum(['COMPLETED', 'CANCELLED', 'DISPUTED'])
  status: 'COMPLETED' | 'CANCELLED' | 'DISPUTED';

  @IsString()
  @IsOptional()
  cancelReason?: string;
}

// Freelancer marks order as delivered
export class DeliverOrderDto {
  @IsString()
  @IsOptional()
  deliveryNote?: string;
}
