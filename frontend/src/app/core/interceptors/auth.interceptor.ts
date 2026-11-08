import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

/** Sends the HttpOnly session cookie to the API and reacts to expired/invalid sessions. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) return next(req);

  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req.clone({ withCredentials: true })).pipe(
    catchError((err: HttpErrorResponse) => {
      const isAuthCall = req.url.endsWith('/auth/login') || req.url.endsWith('/auth/me');
      if (err.status === 401 && !isAuthCall && router.url.startsWith('/manager')) {
        auth.handleUnauthorized(err.error?.code);
      }
      return throwError(() => err);
    })
  );
};
