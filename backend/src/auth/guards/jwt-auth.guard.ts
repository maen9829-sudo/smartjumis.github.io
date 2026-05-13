import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

// Mark a route as public so JwtAuthGuard skips it
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () =>
  (target: any, key?: string, descriptor?: any) => {
    Reflect.defineMetadata(IS_PUBLIC_KEY, true, descriptor?.value ?? target);
    return descriptor ?? target;
  };

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Allow routes decorated with @Public() to skip JWT check
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    return super.canActivate(context);
  }
}
