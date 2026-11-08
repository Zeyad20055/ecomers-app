import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../services/language.service';
import { NotificationService } from '../../services/notification.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-manager-login',
  imports: [ReactiveFormsModule, RouterLink, TranslateModule, IconComponent, LoadingSpinnerComponent],
  template: `
    <div class="page">
      <button type="button" class="lang" (click)="lang.toggle()" [attr.aria-label]="'nav.switchLanguage' | translate"><app-icon name="globe" [size]="18" /> {{ lang.lang() === 'en' ? 'العربية' : 'English' }}</button>
      <form class="card box" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <img src="assets/icons/favicon.svg" alt="" width="52" height="52" />
        <h1>{{ 'login.title' | translate }}</h1>
        <p class="muted">{{ 'login.subtitle' | translate: { store: storeName } }}</p>

        @if (error()) { <div class="alert alert--error" role="alert">{{ error() }}</div> }

        <div class="field">
          <label for="email">{{ 'login.email' | translate }}</label>
          <input id="email" class="input" type="email" dir="ltr" formControlName="email" autocomplete="username" [class.invalid]="invalid('email')" />
          @if (invalid('email')) { <span class="error-text">{{ 'validation.email' | translate }}</span> }
        </div>
        <div class="field">
          <label for="password">{{ 'login.password' | translate }}</label>
          <input id="password" class="input" type="password" dir="ltr" formControlName="password" autocomplete="current-password" [class.invalid]="invalid('password')" />
          @if (invalid('password')) { <span class="error-text">{{ 'validation.required' | translate }}</span> }
        </div>

        <button type="submit" class="btn btn--block" [disabled]="loading()">
          @if (loading()) { <app-loading-spinner [inline]="true" /> } {{ 'login.submit' | translate }}
        </button>
        <a routerLink="/" class="back">{{ 'login.backToStore' | translate }}</a>
      </form>
    </div>
  `,
  styles: [`
    .page { min-height: 100vh; display: grid; place-items: center; padding: 1.5rem; background: radial-gradient(circle at 20% 10%, var(--paper-2), var(--paper) 60%); position: relative; }
    .lang { position: absolute; top: 16px; inset-inline-end: 16px; display: inline-flex; align-items: center; gap: 0.4rem; min-height: 42px; padding: 0 0.9rem; border-radius: 999px; border: 1.5px solid var(--line); background: var(--card); font-weight: 600; cursor: pointer; }
    .box { width: 100%; max-width: 420px; display: grid; gap: 1rem; padding: 2rem 1.75rem; }
    .box h1 { font-size: 1.8rem; margin: 0; }
    .box p { margin: 0; }
    .back { text-align: center; color: var(--muted); font-size: 0.9rem; }
  `]
})
export class ManagerLoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notify = inject(NotificationService);
  readonly lang = inject(LanguageService);
  readonly storeName = environment.storeName;

  readonly loading = signal(false);
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  ngOnInit(): void {
    this.auth.checkSession().subscribe((ok) => {
      if (ok) this.router.navigateByUrl('/manager/dashboard');
    });
  }

  invalid(name: 'email' | 'password'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.error.set('');
    const { email, password } = this.form.getRawValue();
    this.auth.login(email.trim(), password).subscribe({
      next: () => {
        const target = this.route.snapshot.queryParamMap.get('returnUrl') ?? '';
        // Only follow internal manager URLs (prevents open redirects)
        this.router.navigateByUrl(target.startsWith('/manager') && !target.startsWith('//') ? target : '/manager/dashboard');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(this.notify.messageFor(err));
      }
    });
  }
}
