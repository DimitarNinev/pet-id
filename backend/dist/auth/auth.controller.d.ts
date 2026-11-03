import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
interface AuthenticatedRequest {
    user: {
        sub: string;
        email: string;
        role: 'OWNER' | 'VET' | 'ADMIN';
    };
}
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: "OWNER" | "VET" | "ADMIN";
            vetApproved: boolean;
        };
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: "OWNER" | "VET" | "ADMIN";
            vetApproved: boolean;
        };
    }>;
    getMe(request: AuthenticatedRequest): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        vetApproved: boolean;
    }>;
}
export {};
