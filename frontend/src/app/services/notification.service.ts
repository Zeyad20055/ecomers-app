import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly translate = inject(TranslateService);
  private counter = 0;
  readonly toasts = signal<Toast[]>([]);

  success(key: string): void {
    this.push('success', this.translate.instant(key));
  }

  info(key: string): void {
    this.push('info', this.translate.instant(key));
  }

  error(key: string): void {
    this.push('error', this.translate.instant(key));
  }

  /** Shows a translated message for an HTTP error, based on the API error code. */
  httpError(err: unknown): void {
    this.push('error', this.messageFor(err));
  }

  messageFor(err: unknown): string {
    const e = err as HttpErrorResponse;
    if (e && e.status === 0) return this.translate.instant('errors.NETWORK');
    const code = e?.error?.code as string | undefined;
    if (code) {
      const key = `errors.${code}`;
      const text = this.translate.instant(key);
      if (text !== key) return text;
    }
    return this.translate.instant('errors.generic');
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private push(type: Toast['type'], message: string): void {
    const id = ++this.counter;
    this.toasts.update((list) => [...list, { id, type, message }]);
    setTimeout(() => this.dismiss(id), 4500);
  }
}
