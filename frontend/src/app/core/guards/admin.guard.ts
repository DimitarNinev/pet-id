
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url },
    });
  }

  if (auth.hasRole('ADMIN')) {
    return true;
  }

  if (auth.hasRole('VET')) {
    return router.createUrlTree([
      auth.isVetApproved() ? '/vet/dashboard' : '/pending-approval',
    ]);
  }

  if (auth.hasRole('OWNER')) {
    return router.createUrlTree(['/dashboard']);
  }

  return router.createUrlTree(['/login']);
};
