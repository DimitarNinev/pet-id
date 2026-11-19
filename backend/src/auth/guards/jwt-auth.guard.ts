import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service.js';

interface AuthenticatedUser {
    sub: string;
    email: string;
    role: 'OWNER' | 'VET' | 'ADMIN';
    tokenVersion: number;
}

interface RequestWithUser {
    headers: {
        authorization?: string;
    };
    user?: AuthenticatedUser;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<RequestWithUser>();

        const authorization = request.headers.authorization;
        const [scheme, token] = authorization?.split(' ') ?? [];

        if (scheme !== 'Bearer' || !token) {
            throw new UnauthorizedException('Липсва валиден access token.');
        }

        try {
            const payload =
                await this.jwtService.verifyAsync<AuthenticatedUser>(token);

            if (
                typeof payload.sub !== 'string' ||
                typeof payload.email !== 'string' ||
                !['OWNER', 'VET', 'ADMIN'].includes(payload.role) ||
                typeof payload.tokenVersion !== 'number'
            ) {
                throw new UnauthorizedException('Невалиден access token.');
            }

            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
                select: {
                    id: true,
                    tokenVersion: true,
                },
            });

            if (!user || user.tokenVersion !== payload.tokenVersion) {
                throw new UnauthorizedException(
                    'Сесията е невалидна. Моля, влезте отново.',
                );
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
