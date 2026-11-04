import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { API_BASE_URL } from '../config/api.config';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    // Добавяме токена само към заявките към нашия backend.
    if (!req.url.startsWith(`${API_BASE_URL}/`)) {
        return next(req);
    }

    if (
        req.url.endsWith('/auth/login') ||
        req.url.endsWith('/auth/register')
    ) {
        return next(req);
    }

    const token = inject(AuthService).getToken();

    if (!token) {
        return next(req);
    }

    const authReq = req.clone({
        setHeaders: {
            Authorization: `Bearer ${token}`,
        },
    });

    return next(authReq);
};
