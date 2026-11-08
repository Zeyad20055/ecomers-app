import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment';
import { CartService } from '../../../services/cart.service';
import { FavoritesService } from '../../../services/favorites.service';
import { LanguageService } from '../../../services/language.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, TranslateModule, IconComponent],
  template: `
    <header class="nav">
      <div class="container nav__inner">
        <a routerLink="/" class="brand" [attr.aria-label]="storeName">
          <img src="assets/icons/favicon.svg" alt="" width="36" height="36" />
          <span>{{ storeName }}</span>
        </a>

        <nav class="nav__links" [class.open]="menuOpen()" [attr.aria-label]="'nav.main' | translate">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" (click)="menuOpen.set(false)">{{ 'nav.home' | translate }}</a>
          <a routerLink="/" fragment="shop" (click)="menuOpen.set(false)">{{ 'nav.shop' | translate }}</a>
          <a [href]="'tel:' + phone" (click)="menuOpen.set(false)">{{ 'nav.contact' | translate }}</a>
        </nav>

        <div class="nav__actions">
          <button type="button" class="lang" (click)="lang.toggle()" [attr.aria-label]="'nav.switchLanguage' | translate">
            <app-icon name="globe" [size]="18" /> {{ lang.lang() === 'en' ? 'العربية' : 'English' }}
          </button>
          <a routerLink="/favorites" class="icon-btn" [attr.aria-label]="'nav.favorites' | translate" routerLinkActive="icon-btn--active">
            <app-icon name="heart" />
            @if (favorites.count() > 0) { <span class="badge-count">{{ favorites.count() }}</span> }
          </a>
          <a routerLink="/cart" class="icon-btn" [attr.aria-label]="'nav.cart' | translate" routerLinkActive="icon-btn--active">
            <app-icon name="cart" />
            @if (cart.count() > 0) { <span class="badge-count">{{ cart.count() }}</span> }
          </a>
          <button type="button" class="icon-btn nav__burger" (click)="menuOpen.set(!menuOpen())" [attr.aria-expanded]="menuOpen()" [attr.aria-label]="'nav.menu' | translate">
            <app-icon [name]="menuOpen() ? 'close' : 'menu'" />
          </button>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .nav { position: sticky; top: 0; z-index: 100; background: rgba(251, 247, 240, 0.92); backdrop-filter: blur(10px); border-bottom: 1px solid var(--line); }
    .nav__inner { display: flex; align-items: center; justify-content: space-between; gap: 1rem; min-height: 68px; }
    .brand { display: inline-flex; align-items: center; gap: 0.65rem; text-decoration: none; font-family: var(--font-display); font-weight: 700; font-size: 1.3rem; }
    .nav__links { display: flex; gap: 1.6rem; margin-inline: auto 0; }
    .nav__links a { text-decoration: none; font-weight: 600; color: var(--ink-soft); padding-block: 0.3rem; border-bottom: 2px solid transparent; }
    .nav__links a:hover, .nav__links a.active { color: var(--accent); border-color: var(--accent); }
    .nav__actions { display: flex; align-items: center; gap: 0.5rem; }
    .lang { display: inline-flex; align-items: center; gap: 0.4rem; min-height: 42px; padding: 0 0.9rem; border-radius: 999px; border: 1.5px solid var(--line); background: var(--card); font-weight: 600; cursor: pointer; }
    .lang:hover { background: var(--paper-2); }
    .nav__burger { display: none; }
    @media (max-width: 780px) {
      .nav__burger { display: inline-flex; }
      .nav__links { display: none; position: absolute; inset-inline: 0; top: 68px; flex-direction: column; gap: 0; background: var(--paper); border-bottom: 1px solid var(--line); padding: 0.5rem 20px 1rem; }
      .nav__links.open { display: flex; }
      .nav__links a { padding: 0.8rem 0; border: 0; }
      .brand span { max-width: 28vw; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .lang { padding: 0 0.6rem; font-size: 0.85rem; }
    }
    @media (max-width: 480px) {
      .brand span { display: none; }
      .nav__actions { gap: 0.35rem; }
      .nav__inner { gap: 0.5rem; }
    }
  `]
})
export class NavbarComponent {
  readonly cart = inject(CartService);
  readonly favorites = inject(FavoritesService);
  readonly lang = inject(LanguageService);
  readonly menuOpen = signal(false);
  readonly storeName = environment.storeName;
  readonly phone = environment.storePhone;
  private readonly router = inject(Router);

  constructor() {
    this.router.events.subscribe(() => this.menuOpen.set(false));
  }
}
