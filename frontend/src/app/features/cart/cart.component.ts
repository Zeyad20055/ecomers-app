import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CartLineDetail, CartService, MAX_QTY } from '../../services/cart.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { ImgFallbackDirective } from '../../shared/img-fallback.directive';

@Component({
  selector: 'app-cart',
  imports: [RouterLink, TranslateModule, IconComponent, LoadingSpinnerComponent, MoneyPipe, ImgFallbackDirective],
  template: `
    <div class="container section">
      <div class="section__head"><div><span class="eyebrow">{{ 'cart.eyebrow' | translate }}</span><h1 class="h1-sm">{{ 'cart.title' | translate }}</h1></div></div>

      @if (loading()) {
        <app-loading-spinner />
      } @else if (failed()) {
        <div class="alert alert--error row row--between">{{ 'errors.loadFailed' | translate }} <button class="btn btn--sm" type="button" (click)="load()">{{ 'common.retry' | translate }}</button></div>
      } @else if (!rows().length) {
        <div class="empty"><app-icon name="cart" [size]="40" /><h3>{{ 'cart.emptyTitle' | translate }}</h3><p>{{ 'cart.emptyText' | translate }}</p><a routerLink="/" class="btn">{{ 'cart.continue' | translate }}</a></div>
      } @else {
        <div class="layout">
          <div class="lines">
            @if (hasUnavailable()) { <div class="alert alert--info">{{ 'cart.unavailableNotice' | translate }}</div> }
            @for (row of rows(); track row.id) {
              <article class="line card" [class.line--off]="!isBuyable(row)">
                <img [src]="row.item?.image || 'assets/images/placeholder.svg'" appFallback [alt]="row.item?.name || ''" class="line__img" />
                <div class="line__main">
                  @if (row.item; as it) {
                    <a [routerLink]="['/items', it._id]" class="line__name">{{ it.name }}</a>
                    <span class="muted">{{ it.category.name }} · {{ it.price | money }}</span>
                    @if (!isBuyable(row)) { <span class="badge badge--danger">{{ 'product.unavailable' | translate }}</span> }
                  } @else {
                    <span class="line__name">{{ 'cart.itemGone' | translate }}</span>
                    <span class="badge badge--danger">{{ 'product.unavailable' | translate }}</span>
                  }
                </div>
                @if (isBuyable(row)) {
                  <div class="stepper">
                    <button type="button" class="icon-btn" (click)="setQty(row, row.qty - 1)" [disabled]="row.qty <= 1" [attr.aria-label]="'cart.decrease' | translate"><app-icon name="minus" [size]="16" /></button>
                    <span class="stepper__qty" aria-live="polite">{{ row.qty }}</span>
                    <button type="button" class="icon-btn" (click)="setQty(row, row.qty + 1)" [disabled]="row.qty >= max" [attr.aria-label]="'cart.increase' | translate"><app-icon name="plus" [size]="16" /></button>
                  </div>
                  <div class="line__sub">{{ row.item!.price * row.qty | money }}</div>
                }
                <button type="button" class="icon-btn" (click)="remove(row)" [attr.aria-label]="'common.remove' | translate"><app-icon name="trash" [size]="18" /></button>
              </article>
            }
          </div>

          <aside class="summary card">
            <h3>{{ 'cart.summary' | translate }}</h3>
            <div class="row row--between"><span>{{ 'cart.items' | translate }}</span><strong>{{ itemCount() }}</strong></div>
            <div class="row row--between total"><span>{{ 'cart.total' | translate }}</span><strong>{{ total() | money }}</strong></div>
            <p class="muted small">{{ 'cart.totalNote' | translate }}</p>
            <a routerLink="/checkout" class="btn btn--accent btn--block" [class.disabled]="!canCheckout()" [attr.aria-disabled]="!canCheckout()">{{ 'cart.checkout' | translate }}</a>
            <a routerLink="/" class="btn btn--ghost btn--block" style="margin-top:0.6rem">{{ 'cart.continue' | translate }}</a>
          </aside>
        </div>
      }
    </div>
  `,
  styles: [`
    .h1-sm { font-size: clamp(1.7rem, 4vw, 2.4rem); margin: 0; }
    .layout { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 1.5rem; align-items: start; }
    .lines { display: grid; gap: 0.9rem; }
    .line { display: grid; grid-template-columns: 84px minmax(0, 1fr) auto auto auto; gap: 1rem; align-items: center; padding: 0.9rem; }
    .line--off { opacity: 0.7; background: #f7f2e8; }
    .line__img { width: 84px; height: 84px; object-fit: cover; border-radius: 10px; background: var(--paper-2); }
    .line__main { display: flex; flex-direction: column; gap: 0.2rem; min-width: 0; }
    .line__name { font-weight: 700; text-decoration: none; }
    .line__name:hover { color: var(--accent); }
    .line__sub { font-weight: 700; min-width: 90px; text-align: end; }
    .stepper { display: inline-flex; align-items: center; gap: 0.4rem; }
    .stepper .icon-btn { width: 34px; height: 34px; }
    .stepper__qty { min-width: 2rem; text-align: center; font-weight: 700; }
    .summary { position: sticky; top: 90px; display: grid; gap: 0.8rem; }
    .total { font-size: 1.25rem; padding-top: 0.6rem; border-top: 1px dashed var(--line); }
    .small { font-size: 0.82rem; margin: 0; }
    .disabled { pointer-events: none; opacity: 0.5; }
    @media (max-width: 900px) { .layout { grid-template-columns: 1fr; } .summary { position: static; } }
    @media (max-width: 620px) {
      .line { grid-template-columns: 70px minmax(0, 1fr) auto; }
      .line__img { width: 70px; height: 70px; }
      .line .stepper, .line__sub { grid-column: 2 / span 2; }
      .line__sub { text-align: start; }
    }
  `]
})
export class CartComponent implements OnInit {
  private readonly cart = inject(CartService);
  readonly max = MAX_QTY;
  readonly rows = signal<CartLineDetail[]>([]);
  readonly loading = signal(true);
  readonly failed = signal(false);

  readonly hasUnavailable = computed(() => this.rows().some((r) => !this.isBuyable(r)));
  readonly itemCount = computed(() => this.rows().filter((r) => this.isBuyable(r)).reduce((s, r) => s + r.qty, 0));
  readonly total = computed(() => this.rows().filter((r) => this.isBuyable(r)).reduce((s, r) => s + r.item!.price * r.qty, 0));
  readonly canCheckout = computed(() => this.rows().length > 0 && !this.hasUnavailable());

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.failed.set(false);
    this.cart.loadDetailed().subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      }
    });
  }

  isBuyable(row: CartLineDetail): boolean {
    return !!row.item && row.item.isAvailable !== false;
  }

  setQty(row: CartLineDetail, qty: number): void {
    if (qty < 1 || qty > MAX_QTY) return;
    this.cart.setQty(row.id, qty);
    this.rows.update((rows) => rows.map((r) => (r.id === row.id ? { ...r, qty } : r)));
  }

  remove(row: CartLineDetail): void {
    this.cart.remove(row.id);
    this.rows.update((rows) => rows.filter((r) => r.id !== row.id));
  }
}
