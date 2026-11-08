import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, TranslateModule],
  template: `
    <div class="container section">
      <div class="empty">
        <div class="code" aria-hidden="true">404</div>
        <h1 class="h1-sm">{{ 'notFound.title' | translate }}</h1>
        <p>{{ 'notFound.text' | translate }}</p>
        <a routerLink="/" class="btn">{{ 'notFound.home' | translate }}</a>
      </div>
    </div>
  `,
  styles: [`
    .code { font-family: var(--font-display); font-size: clamp(4rem, 14vw, 7rem); font-weight: 700; color: var(--accent); line-height: 1; }
    .h1-sm { font-size: clamp(1.6rem, 4vw, 2.2rem); }
  `]
})
export class NotFoundComponent {}
