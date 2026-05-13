import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Usage: @CurrentUser() user: { id: string; email: string }
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
