import { HttpInterceptorFn } from '@angular/common/http';

const TOKEN_KEY = 'pet-id-access-token';
const API_URL = 'http://localhost:3000/api/v1/';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    // Добавяме токена само към заявките към нашия backend.
    if (!req.url.startsWith(API_URL)) {
        return next(req);
    }

    if (
        req.url.endsWith('/auth/login') ||
        req.url.endsWith('/auth/register')
    ) {
        return next(req);
    }

    const token = localStorage.getItem(TOKEN_KEY);

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