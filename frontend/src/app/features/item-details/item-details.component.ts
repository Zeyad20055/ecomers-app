import { Component, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Item } from '../../core/models/item.model';
import { ItemService } from '../../core/services/item.service';
import { MAX_QTY, CartService } from '../../services/cart.service';
import { FavoritesService } from '../../services/favorites.service';
import { NotificationService } from '../../services/notification.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { ImgFallbackDirective } from '../../shared/img-fallback.directive';

@Component({
  selector: 'app-item-details',
  imports: [RouterLink, TranslateModule, IconComponent, LoadingSpinnerComponent, ProductCardComponent, MoneyPipe, ImgFallbackDirective],
  template: `
    <div class="container section">
      <a routerLink="/" class="back"><app-icon name="arrow" [size]="16" class="flip-rtl-back" /> {{ 'details.back' | translate }}</a>

      @if (loading()) {
        <app-loading-spinner />
      } @else if (notFound()) {
        <div class="empty"><h3>{{ 'details.notFoundTitle' | translate }}</h3><p>{{ 'details.notFoundText' | translate }}</p><a routerLink="/" class="btn">{{ 'details.back' | translate }}</a></div>
      } @else if (failed()) {
        <div class="alert alert--error row row--between">{{ 'errors.loadFailed' | translate }} <button class="btn btn--sm" type="button" (click)="load(id())">{{ 'common.retry' | translate }}</button></div>
      } @else {
      @if (item(); as it) {
        <div class="detail">
          <div class="detail__media"><img [src]="it.image || 'assets/images/placeholder.svg'" appFallback [alt]="it.name" /></div>
          <div class="detail__info">
            <span class="eyebrow">{{ it.category.name }}</span>
            <h1>{{ it.name }}</h1>
            <div class="detail__price">{{ it.price | money }}</div>
            @if (it.isAvailable === false) {
              <span class="badge badge--muted">{{ 'product.unavailable' | translate }}</span>
            } @else {
              <span class="badge badge--ok"><app-icon name="check" [size]="14" /> {{ 'product.available' | translate }}</span>
            }
            <p class="detail__desc">{{ it.description }}</p>

            <div class="field qty">
              <label for="qty">{{ 'details.quantity' | translate }}</label>
              <div class="stepper">
                <button type="button" class="icon-btn" (click)="change(-1)" [disabled]="qty() <= 1" [attr.aria-label]="'cart.decrease' | translate"><app-icon name="minus" /></button>
                <input id="qty" class="input stepper__input" type="number" inputmode="numeric" min="1" [max]="max" [value]="qty()" (change)="onQty($event)" />
                <button type="button" class="icon-btn" (click)="change(1)" [disabled]="qty() >= max" [attr.aria-label]="'cart.increase' | translate"><app-icon name="plus" /></button>
              </div>
              @if (qtyError()) { <span class="error-text">{{ 'details.qtyInvalid' | translate }}</span> }
            </div>

            <div class="row" style="margin-top:1.25rem">
              <button type="button" class="btn btn--accent" [disabled]="it.isAvailable === false" (click)="addToCart(it)"><app-icon name="cart" [size]="18" /> {{ 'product.addToCart' | translate }}</button>
              <button type="button" class="btn btn--ghost" (click)="favorites.toggle(it._id)" [attr.aria-pressed]="favorites.has(it._id)">
                <app-icon name="heart" [size]="18" [fill]="favorites.has(it._id)" /> {{ (favorites.has(it._id) ? 'product.removeFavorite' : 'product.addFavorite') | translate }}
              </button>
            </div>
            @if (cart.qtyOf(it._id) > 0) { <p class="muted" style="margin-top:0.75rem">{{ 'details.inCart' | translate: { count: cart.qtyOf(it._id) } }} · <a routerLink="/cart">{{ 'details.viewCart' | translate }}</a></p> }
          </div>
        </div>

        @if (related().length) {
          <section class="related">
            <h2>{{ 'details.related' | translate }}</h2>
            <div class="grid-products">@for (r of related(); track r._id) { <app-product-card [item]="r" /> }</div>
          </section>
        }
      }
      }
    </div>
  `,
  styles: [`
    .back { display: inline-flex; align-items: center; gap: 0.4rem; text-decoration: none; font-weight: 600; margin-bottom: 1.25rem; color: var(--ink-soft); }
    :host-context([dir='ltr']) .flip-rtl-back { transform: scaleX(-1); display: inline-flex; }
    .detail { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 2.5rem; align-items: start; }
    .detail__media { border-radius: var(--radius); overflow: hidden; border: 1px solid var(--line); background: var(--paper-2); aspect-ratio: 1 / 1; }
    .detail__media img { width: 100%; height: 100%; object-fit: cover; }
    .detail__price { font-size: 2rem; font-weight: 700; margin-block: 0.25rem 0.75rem; }
    .detail__desc { margin-top: 1rem; color: var(--ink-soft); white-space: pre-line; }
    .qty { margin-top: 1.25rem; }
    .stepper { display: inline-flex; align-items: center; gap: 0.5rem; }
    .stepper__input { width: 76px; text-align: center; }
    .related { margin-top: 4rem; }
    @media (max-width: 800px) { .detail { grid-template-columns: 1fr; gap: 1.5rem; } }
  `]
})
export class ItemDetailsComponent {
  readonly id = input.required<string>();
  private readonly api = inject(ItemService);
  private readonly notify = inject(NotificationService);
  readonly cart = inject(CartService);
  readonly favorites = inject(FavoritesService);

  readonly item = signal<Item | null>(null);
  readonly related = signal<Item[]>([]);
  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly failed = signal(false);
  readonly qty = signal(1);
  readonly qtyError = signal(false);
  readonly max = MAX_QTY;

  constructor() {
    effect(() => this.load(this.id()));
  }

  load(id: string): void {
    this.loading.set(true);
    this.notFound.set(false);
    this.failed.set(false);
    this.qty.set(1);
    this.qtyError.set(false);
    this.related.set([]);
    this.api.getById(id).subscribe({
      next: (res) => {
        this.item.set(res.data);
        this.loading.set(false);
        this.api.list({ category: res.data.category._id, limit: 5 }).subscribe({
          next: (r) => this.related.set(r.data.filter((i) => i._id !== res.data._id).slice(0, 4)),
          error: () => this.related.set([])
        });
      },
      error: (err) => {
        this.item.set(null);
        this.notFound.set(err.status === 404 || err.status === 400);
        this.failed.set(!this.notFound());
        this.loading.set(false);
      }
    });
  }

  change(delta: number): void {
    this.setQty(this.qty() + delta);
  }

  onQty(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = Number(input.value);
    if (!Number.isInteger(value) || value < 1 || value > MAX_QTY) {
      this.qtyError.set(true);
      input.value = String(this.qty());
      return;
    }
    this.setQty(value);
  }

  addToCart(item: Item): void {
    this.cart.add(item._id, this.qty());
    this.notify.success('product.addedToCart');
  }

  private setQty(value: number): void {
    this.qtyError.set(false);
    this.qty.set(Math.min(MAX_QTY, Math.max(1, value)));
  }
}
