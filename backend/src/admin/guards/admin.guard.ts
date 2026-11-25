import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

interface AuthenticatedRequest {
  user?: {
    sub: string;
    email: string;
    role: 'OWNER' | 'VET' | 'ADMIN';
    tokenVersion: number;
  };
}

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request =
      context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (request.user?.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Нямате права за достъп до административната зона.',
      );
    }

    return true;
  }
}
