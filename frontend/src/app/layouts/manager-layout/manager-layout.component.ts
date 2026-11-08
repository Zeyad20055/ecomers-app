import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../services/language.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-manager-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslateModule, IconComponent],
  template: `
    <div class="shell">
      <aside class="side" [class.open]="open()">
        <a routerLink="/manager/dashboard" class="side__brand">
          <img src="assets/icons/favicon.svg" alt="" width="34" height="34" />
          <span>{{ storeName }}</span>
        </a>
        <nav class="side__nav" [attr.aria-label]="'manager.nav.label' | translate">
          <a routerLink="/manager/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }"><app-icon name="grid" /> {{ 'manager.nav.dashboard' | translate }}</a>
          <a routerLink="/manager/dashboard/categories" routerLinkActive="active"><app-icon name="tag" /> {{ 'manager.nav.categories' | translate }}</a>
          <a routerLink="/manager/dashboard/items" routerLinkActive="active"><app-icon name="box" /> {{ 'manager.nav.items' | translate }}</a>
          <a routerLink="/manager/dashboard/orders" routerLinkActive="active"><app-icon name="receipt" /> {{ 'manager.nav.orders' | translate }}</a>
          <a routerLink="/manager/dashboard/notes" routerLinkActive="active"><app-icon name="note" /> {{ 'manager.nav.notes' | translate }}</a>
        </nav>
        <a routerLink="/" class="side__store"><app-icon name="home" /> {{ 'manager.nav.viewStore' | translate }}</a>
      </aside>
      @if (open()) { <div class="scrim" (click)="open.set(false)"></div> }

      <div class="main">
        <header class="top">
          <button type="button" class="icon-btn top__burger" (click)="open.set(!open())" [attr.aria-expanded]="open()" [attr.aria-label]="'nav.menu' | translate"><app-icon name="menu" /></button>
          <div class="grow"></div>
          <button type="button" class="lang" (click)="lang.toggle()" [attr.aria-label]="'nav.switchLanguage' | translate"><app-icon name="globe" [size]="18" /> {{ lang.lang() === 'en' ? 'العربية' : 'English' }}</button>
          <div class="menu">
            <button type="button" class="acct" (click)="menuOpen.set(!menuOpen())" [attr.aria-expanded]="menuOpen()" aria-haspopup="true">
              <span class="acct__avatar">{{ initial() }}</span>
              <span class="acct__name">{{ auth.manager()?.name }}</span>
              <app-icon name="chevdown" [size]="16" />
            </button>
            @if (menuOpen()) {
              <div class="menu__panel" role="menu">
                <div class="menu__info"><strong>{{ auth.manager()?.name }}</strong><span class="muted" dir="ltr">{{ auth.manager()?.email }}</span></div>
                <button type="button" role="menuitem" class="menu__item" (click)="auth.logout()"><app-icon name="logout" [size]="18" /> {{ 'manager.logout' | translate }}</button>
              </div>
            }
          </div>
        </header>
        <main class="content"><router-outlet /></main>
      </div>
    </div>
  `,
  styles: [`
    .shell { display: grid; grid-template-columns: 260px minmax(0, 1fr); min-height: 100vh; }
    .side { background: var(--ink); color: #dfe9e3; padding: 1.25rem 1rem; display: flex; flex-direction: column; gap: 1.5rem; position: sticky; top: 0; height: 100vh; }
    .side__brand { display: flex; align-items: center; gap: 0.6rem; font-family: var(--font-display); font-weight: 700; font-size: 1.2rem; color: #fff; text-decoration: none; padding: 0.25rem 0.5rem; }
    .side__nav { display: flex; flex-direction: column; gap: 0.25rem; }
    .side__nav a, .side__store { display: flex; align-items: center; gap: 0.75rem; padding: 0.7rem 0.85rem; border-radius: 10px; color: #cfdcd5; text-decoration: none; font-weight: 600; }
    .side__nav a:hover, .side__store:hover { background: rgba(255,255,255,0.08); color: #fff; }
    .side__nav a.active { background: var(--accent); color: #fff; }
    .side__store { margin-top: auto; border: 1px solid rgba(255,255,255,0.18); }
    .main { min-width: 0; display: flex; flex-direction: column; }
    .top { display: flex; align-items: center; gap: 0.75rem; padding: 0.7rem 1.5rem; background: var(--card); border-bottom: 1px solid var(--line); position: sticky; top: 0; z-index: 40; }
    .top__burger { display: none; }
    .lang { display: inline-flex; align-items: center; gap: 0.4rem; min-height: 42px; padding: 0 0.9rem; border-radius: 999px; border: 1.5px solid var(--line); background: var(--card); font-weight: 600; cursor: pointer; }
    .menu { position: relative; }
    .acct { display: inline-flex; align-items: center; gap: 0.5rem; min-height: 42px; padding: 0 0.7rem 0 0.35rem; border-radius: 999px; border: 1.5px solid var(--line); background: var(--card); cursor: pointer; font-weight: 600; }
    [dir='rtl'] .acct { padding: 0 0.35rem 0 0.7rem; }
    .acct__avatar { width: 30px; height: 30px; border-radius: 50%; background: var(--ink); color: #fff; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; text-transform: uppercase; }
    .menu__panel { position: absolute; inset-inline-end: 0; top: calc(100% + 8px); min-width: 230px; background: var(--card); border: 1px solid var(--line); border-radius: var(--radius-sm); box-shadow: var(--shadow-lg); padding: 0.5rem; z-index: 60; }
    .menu__info { display: flex; flex-direction: column; padding: 0.5rem 0.6rem 0.7rem; border-bottom: 1px solid var(--line); margin-bottom: 0.4rem; font-size: 0.9rem; }
    .menu__item { display: flex; align-items: center; gap: 0.6rem; width: 100%; padding: 0.6rem; border: 0; background: none; border-radius: 8px; cursor: pointer; font-weight: 600; color: var(--danger); }
    .menu__item:hover { background: var(--danger-soft); }
    .content { padding: 1.5rem; width: 100%; max-width: 1280px; }
    .scrim { display: none; }
    @media (max-width: 900px) {
      .shell { grid-template-columns: 1fr; }
      .side { position: fixed; inset-block: 0; inset-inline-start: 0; width: 270px; z-index: 300; transform: translateX(-105%); transition: transform 0.25s var(--ease); }
      [dir='rtl'] .side { transform: translateX(105%); }
      .side.open { transform: none; }
      .scrim { display: block; position: fixed; inset: 0; background: rgba(12,28,23,0.5); z-index: 250; }
      .top__burger { display: inline-flex; }
      .top { padding-inline: 1rem; }
      .content { padding: 1rem; }
      .acct__name { display: none; }
    }
  `]
})
export class ManagerLayoutComponent {
  readonly auth = inject(AuthService);
  readonly lang = inject(LanguageService);
  readonly storeName = environment.storeName;
  readonly open = signal(false);
  readonly menuOpen = signal(false);
  private readonly router = inject(Router);

  constructor() {
    this.router.events.subscribe(() => {
      this.open.set(false);
      this.menuOpen.set(false);
    });
  }

  initial(): string {
    return (this.auth.manager()?.name || '?').trim().charAt(0);
  }
}
