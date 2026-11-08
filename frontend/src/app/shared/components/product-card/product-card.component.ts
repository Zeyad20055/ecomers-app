import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Item } from '../../../core/models/item.model';
import { CartService } from '../../../services/cart.service';
import { FavoritesService } from '../../../services/favorites.service';
import { NotificationService } from '../../../services/notification.service';
import { MoneyPipe } from '../../pipes/money.pipe';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-product-card',
  imports: [RouterLink, TranslateModule, IconComponent, MoneyPipe],
  template: `
    <article class="pc">
      <a [routerLink]="['/items', item()._id]" class="pc__media" [attr.aria-label]="item().name">
        <img [src]="item().image || placeholder" [alt]="item().name" loading="lazy" (error)="onImgError($event)" />
        @if (item().isAvailable === false) {
          <span class="badge badge--muted pc__flag">{{ 'product.unavailable' | translate }}</span>
        } @else if (item().isFeatured) {
          <span class="badge badge--warn pc__flag"><app-icon name="star" [size]="12" [fill]="true" /> {{ 'product.featured' | translate }}</span>
        }
      </a>
      <button type="button" class="icon-btn pc__fav" [class.icon-btn--active]="favorites.has(item()._id)"
        (click)="favorites.toggle(item()._id)" [attr.aria-pressed]="favorites.has(item()._id)"
        [attr.aria-label]="(favorites.has(item()._id) ? 'product.removeFavorite' : 'product.addFavorite') | translate">
        <app-icon name="heart" [fill]="favorites.has(item()._id)" />
      </button>
      <div class="pc__body">
        <span class="pc__cat">{{ item().category.name }}</span>
        <h3 class="pc__name"><a [routerLink]="['/items', item()._id]">{{ item().name }}</a></h3>
        <p class="pc__desc">{{ item().description }}</p>
        <div class="pc__price">{{ item().price | money }}</div>
        <div class="pc__actions">
          <button type="button" class="btn btn--accent btn--sm grow" [disabled]="item().isAvailable === false" (click)="addToCart()">
            <app-icon name="cart" [size]="16" /> {{ 'product.addToCart' | translate }}
          </button>
          <a [routerLink]="['/items', item()._id]" class="btn btn--ghost btn--sm">{{ 'product.viewDetails' | translate }}</a>
        </div>
      </div>
    </article>
  `,
  styles: [`
    .pc { position: relative; display: flex; flex-direction: column; background: var(--card); border: 1px solid var(--line); border-radius: var(--radius); overflow: hidden; height: 100%; transition: transform 0.2s var(--ease), box-shadow 0.2s; }
    .pc:hover { transform: translateY(-3px); box-shadow: var(--shadow); }
    .pc__media { position: relative; display: block; aspect-ratio: 1 / 1; background: var(--paper-2); overflow: hidden; }
    .pc__media img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s var(--ease); }
    .pc:hover .pc__media img { transform: scale(1.04); }
    .pc__flag { position: absolute; top: 10px; inset-inline-start: 10px; }
    .pc__fav { position: absolute; top: 10px; inset-inline-end: 10px; width: 38px; height: 38px; }
    .pc__body { display: flex; flex-direction: column; gap: 0.35rem; padding: 1rem; flex: 1; }
    .pc__cat { font-size: 0.74rem; font-weight: 700; color: var(--accent); text-transform: uppercase; letter-spacing: 0.08em; }
    html[lang='ar'] .pc__cat { text-transform: none; letter-spacing: 0; font-size: 0.82rem; }
    .pc__name { margin: 0; font-size: 1.05rem; }
    .pc__name a { text-decoration: none; }
    .pc__name a:hover { color: var(--accent); }
    .pc__desc { color: var(--muted); font-size: 0.9rem; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 2.8em; }
    .pc__price { font-weight: 700; font-size: 1.2rem; margin-top: auto; padding-top: 0.4rem; }
    .pc__actions { display: flex; gap: 0.5rem; margin-top: 0.4rem; }
  `]
})
export class ProductCardComponent {
  readonly item = input.required<Item>();
  readonly favorites = inject(FavoritesService);
  private readonly cart = inject(CartService);
  private readonly notify = inject(NotificationService);
  readonly placeholder = 'assets/images/placeholder.svg';

  addToCart(): void {
    this.cart.add(this.item()._id, 1);
    this.notify.success('product.addedToCart');
  }

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (!img.src.endsWith('placeholder.svg')) img.src = this.placeholder;
  }
}
