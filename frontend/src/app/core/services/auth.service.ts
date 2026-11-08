import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotificationService } from '../../services/notification.service';
import { ApiResponse, Manager } from '../models/api.model';

/**
 * Authentication uses an HttpOnly cookie set by the API. The token is never readable by
 * JavaScript, so this service only keeps the manager profile in memory.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);
  private readonly base = `${environment.apiUrl}/auth`;
  private expiryTimer: ReturnType<typeof setTimeout> | undefined;

  readonly manager = signal<Manager | null>(null);

  login(email: string, password: string): Observable<Manager> {
    return this.http
      .post<ApiResponse<{ manager: Manager; expiresAt: number }>>(`${this.base}/login`, { email, password })
      .pipe(
        tap((res) => {
          this.manager.set(res.data.manager);
          this.scheduleExpiry(res.data.expiresAt);
        }),
        map((res) => res.data.manager)
      );
  }

  logout(): void {
    this.http
      .post(`${this.base}/logout`, {})
      .pipe(
        catchError(() => of(null)),
        finalize(() => {
          this.clear();
          this.router.navigate(['/manager/login']);
        })
      )
      .subscribe();
  }

  /** True when the browser holds a valid session cookie. */
  checkSession(): Observable<boolean> {
    if (this.manager()) return of(true);
    return this.http.get<ApiResponse<{ manager: Manager }>>(`${this.base}/me`).pipe(
      tap((res) => this.manager.set(res.data.manager)),
      map(() => true),
      catchError(() => of(false))
    );
  }

  /** Called by the interceptor when the API answers 401 on a manager request. */
  handleUnauthorized(code?: string): void {
    const wasLoggedIn = !!this.manager();
    this.clear();
    if (wasLoggedIn) this.notify.error(code === 'TOKEN_EXPIRED' ? 'errors.TOKEN_EXPIRED' : 'errors.UNAUTHORIZED');
    this.router.navigate(['/manager/login'], { queryParams: { returnUrl: this.router.url } });
  }

  private clear(): void {
    clearTimeout(this.expiryTimer);
    this.manager.set(null);
  }

  private scheduleExpiry(expiresAt: number): void {
    clearTimeout(this.expiryTimer);
    const ms = expiresAt - Date.now();
    if (ms > 0 && ms < 2_147_000_000) {
      this.expiryTimer = setTimeout(() => this.handleUnauthorized('TOKEN_EXPIRED'), ms);
    }
  }
}
