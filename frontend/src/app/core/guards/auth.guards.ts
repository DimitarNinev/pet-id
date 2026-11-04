import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authenticatedGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  if (!auth.hasRole('OWNER') && !auth.hasRole('VET')) {
    return router.createUrlTree(['/login']);
  }

  if (auth.hasRole('VET') && !auth.isVetApproved()) {
    return router.createUrlTree(['/pending-approval']);
  }

  return true;
};

export const ownerGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  if (auth.hasRole('OWNER')) return true;
  if (auth.hasRole('VET')) {
    return router.createUrlTree([
      auth.isVetApproved() ? '/vet/dashboard' : '/pending-approval',
    ]);
  }
  return router.createUrlTree(['/login']);
};

export const vetGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  if (!auth.hasRole('VET')) {
    return auth.hasRole('OWNER')
      ? router.createUrlTree(['/dashboard'])
      : router.createUrlTree(['/login']);
  }

  return auth.isVetApproved()
    ? true
    : router.createUrlTree(['/pending-approval']);
};

export const pendingApprovalGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) return router.createUrlTree(['/login']);
  if (!auth.hasRole('VET') && !auth.hasRole('OWNER')) return router.createUrlTree(['/login']);
  return auth.hasRole('VET') && !auth.isVetApproved()
    ? true
    : router.createUrlTree([auth.hasRole('VET') ? '/vet/dashboard' : '/dashboard']);
};
