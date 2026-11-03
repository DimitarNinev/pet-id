import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface AuthenticatedUser {
    sub: string;
    email: string;
    role: 'OWNER' | 'VET' | 'ADMIN';
}

interface RequestWithUser {
    headers: {
        authorization?: string;
    };
    user?: AuthenticatedUser;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(private readonly jwtService: JwtService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request =
            context.switchToHttp().getRequest<RequestWithUser>();

        const authorization = request.headers.authorization;
        const [scheme, token] = authorization?.split(' ') ?? [];

        if (scheme !== 'Bearer' || !token) {
            throw new UnauthorizedException(
                'Липсва валиден access token.',
            );
        }

        try {
            const payload =
                await this.jwtService.verifyAsync<AuthenticatedUser>(token);

            if (
                typeof payload.sub !== 'string' ||
                typeof payload.email !== 'string' ||
                !['OWNER', 'VET', 'ADMIN'].includes(payload.role)
            ) {
                throw new UnauthorizedException('Невалиден access token.');
            }

            request.user = payload;

            return true;
        } catch {
            throw new UnauthorizedException(
                'Access token е невалиден или е изтекъл.',
            );
        }
    }
}