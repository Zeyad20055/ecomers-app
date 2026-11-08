import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { Category } from '../../core/models/category.model';
import { Item, ItemQuery } from '../../core/models/item.model';
import { PageMeta } from '../../core/models/api.model';
import { CategoryService } from '../../core/services/category.service';
import { ItemService } from '../../core/services/item.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { ImgFallbackDirective } from '../../shared/img-fallback.directive';

@Component({
  selector: 'app-home',
  imports: [FormsModule, RouterLink, TranslateModule, IconComponent, LoadingSpinnerComponent, PaginationComponent, ProductCardComponent, ImgFallbackDirective],
  template: `
    <section class="hero">
      <div class="container hero__inner">
        <div class="hero__copy">
          <span class="eyebrow">{{ 'home.hero.eyebrow' | translate }}</span>
          <h1>{{ 'home.hero.title' | translate }}</h1>
          <p class="hero__sub">{{ 'home.hero.subtitle' | translate }}</p>
          <form class="hero__search" (submit)="heroSearch($event)" role="search">
            <label class="sr-only" for="hero-search">{{ 'home.searchLabel' | translate }}</label>
            <input id="hero-search" class="input" type="search" name="q" [(ngModel)]="heroQuery" [placeholder]="'home.searchPlaceholder' | translate" maxlength="100" />
            <button type="submit" class="btn btn--accent"><app-icon name="search" [size]="18" /> {{ 'home.search' | translate }}</button>
          </form>
        </div>
        <div class="hero__art" aria-hidden="true">
          <div class="blob blob--a"></div><div class="blob blob--b"></div>
          <div class="tag tag--1"><app-icon name="truck" [size]="20" /> {{ 'home.hero.chipDelivery' | translate }}</div>
          <div class="tag tag--2"><app-icon name="phone" [size]="20" /> {{ 'home.hero.chipPhone' | translate }}</div>
          <div class="bag"><app-icon name="cart" [size]="64" /></div>
        </div>
      </div>
    </section>

    <section class="container perks">
      <div class="perk"><app-icon name="phone" /><div><strong>{{ 'home.perks.confirmTitle' | translate }}</strong><span>{{ 'home.perks.confirmText' | translate }}</span></div></div>
      <div class="perk"><app-icon name="truck" /><div><strong>{{ 'home.perks.deliveryTitle' | translate }}</strong><span>{{ 'home.perks.deliveryText' | translate }}</span></div></div>
      <div class="perk"><app-icon name="shield" /><div><strong>{{ 'home.perks.payTitle' | translate }}</strong><span>{{ 'home.perks.payText' | translate }}</span></div></div>
    </section>

    @if (categories().length) {
      <section class="container section">
        <div class="section__head"><div><span class="eyebrow">{{ 'home.categories.eyebrow' | translate }}</span><h2>{{ 'home.categories.title' | translate }}</h2></div></div>
        <div class="cats">
          @for (cat of categories(); track cat._id) {
            <a class="cat" routerLink="/" fragment="shop" (click)="pickCategory(cat._id)">
              <img [src]="cat.image || 'assets/images/placeholder.svg'" appFallback alt="" loading="lazy" />
              <span class="cat__name">{{ cat.name }}</span>
            </a>
          }
        </div>
      </section>
    }

    @if (featured().length) {
      <section class="container section">
        <div class="section__head"><div><span class="eyebrow">{{ 'home.featured.eyebrow' | translate }}</span><h2>{{ 'home.featured.title' | translate }}</h2></div></div>
        <div class="grid-products">@for (item of featured(); track item._id) { <app-product-card [item]="item" /> }</div>
      </section>
    }

    @if (latest().length) {
      <section class="container section">
        <div class="section__head"><div><span class="eyebrow">{{ 'home.latest.eyebrow' | translate }}</span><h2>{{ 'home.latest.title' | translate }}</h2></div></div>
        <div class="grid-products">@for (item of latest(); track item._id) { <app-product-card [item]="item" /> }</div>
      </section>
    }

    <section class="container section shop" id="shop">
      <div class="section__head"><div><span class="eyebrow">{{ 'home.shop.eyebrow' | translate }}</span><h2>{{ 'home.shop.title' | translate }}</h2></div></div>

      <div class="filters">
        <div class="search-box">
          <app-icon name="search" [size]="18" />
          <label class="sr-only" for="shop-search">{{ 'home.searchLabel' | translate }}</label>
          <input id="shop-search" class="input" type="search" [ngModel]="search" (ngModelChange)="onSearch($event)" [placeholder]="'home.searchPlaceholder' | translate" maxlength="100" />
        </div>
        <label class="sr-only" for="shop-sort">{{ 'home.sort.label' | translate }}</label>
        <select id="shop-sort" class="select filters__sort" [ngModel]="sort" (ngModelChange)="onSort($event)">
          <option value="newest">{{ 'home.sort.newest' | translate }}</option>
          <option value="price_asc">{{ 'home.sort.priceAsc' | translate }}</option>
          <option value="price_desc">{{ 'home.sort.priceDesc' | translate }}</option>
          <option value="name">{{ 'home.sort.name' | translate }}</option>
        </select>
      </div>

      <div class="chips" role="group" [attr.aria-label]="'home.categories.title' | translate">
        <button type="button" class="chip" [class.chip--on]="!category" (click)="pickCategory('')">{{ 'home.allCategories' | translate }}</button>
        @for (cat of categories(); track cat._id) {
          <button type="button" class="chip" [class.chip--on]="category === cat._id" (click)="pickCategory(cat._id)">{{ cat.name }}</button>
        }
      </div>

      @if (loading()) {
        <app-loading-spinner />
      } @else if (error()) {
        <div class="alert alert--error row row--between">{{ 'errors.loadFailed' | translate }} <button type="button" class="btn btn--sm" (click)="loadCatalog()">{{ 'common.retry' | translate }}</button></div>
      } @else if (!items().length) {
        <div class="empty"><h3>{{ 'home.empty.title' | translate }}</h3><p>{{ 'home.empty.text' | translate }}</p></div>
      } @else {
        <div class="grid-products">@for (item of items(); track item._id) { <app-product-card [item]="item" /> }</div>
        <app-pagination [page]="meta().page" [pages]="meta().pages" (pageChange)="goToPage($event)" />
      }
    </section>
  `,
  styles: [`
    .hero { background: linear-gradient(160deg, var(--paper-2), var(--paper)); border-bottom: 1px solid var(--line); overflow: hidden; }
    .hero__inner { display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 2rem; align-items: center; padding-block: 4rem; }
    .hero__sub { font-size: 1.1rem; color: var(--ink-soft); max-width: 46ch; }
    .hero__search { display: flex; gap: 0.6rem; max-width: 520px; margin-top: 1.5rem; }
    .hero__art { position: relative; min-height: 320px; }
    .blob { position: absolute; border-radius: 50%; }
    .blob--a { width: 280px; height: 280px; background: var(--ink); inset-inline-end: 10%; top: 6%; }
    .blob--b { width: 150px; height: 150px; background: var(--accent); inset-inline-start: 8%; bottom: 6%; }
    .bag { position: absolute; inset-inline-end: calc(10% + 108px); top: calc(6% + 108px); color: var(--paper); }
    .tag { position: absolute; display: inline-flex; align-items: center; gap: 0.5rem; background: #fff; border: 1px solid var(--line); box-shadow: var(--shadow); padding: 0.55rem 0.9rem; border-radius: 999px; font-weight: 700; font-size: 0.9rem; animation: float 5s ease-in-out infinite; }
    .tag--1 { top: 2%; inset-inline-start: 6%; }
    .tag--2 { bottom: 14%; inset-inline-end: 0; animation-delay: -2.5s; }
    @keyframes float { 50% { transform: translateY(-8px); } }
    .perks { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-top: -1.6rem; position: relative; }
    .perk { display: flex; gap: 0.9rem; align-items: center; background: var(--card); border: 1px solid var(--line); border-radius: var(--radius); padding: 1rem 1.2rem; box-shadow: var(--shadow); color: var(--accent); }
    .perk div { display: flex; flex-direction: column; color: var(--ink); font-size: 0.9rem; }
    .perk span { color: var(--muted); }
    .cats { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 1rem; }
    .cat { position: relative; display: block; border-radius: var(--radius); overflow: hidden; aspect-ratio: 4 / 3; text-decoration: none; color: #fff; background: var(--ink); }
    .cat img { width: 100%; height: 100%; object-fit: cover; opacity: 0.75; transition: transform 0.4s var(--ease), opacity 0.2s; }
    .cat:hover img { transform: scale(1.06); opacity: 0.9; }
    .cat__name { position: absolute; inset-inline: 0; bottom: 0; padding: 0.7rem 0.9rem; font-weight: 700; background: linear-gradient(transparent, rgba(12,28,23,0.85)); }
    .shop { scroll-margin-top: 80px; }
    .filters { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1rem; }
    .filters__sort { width: auto; min-width: 190px; }
    .chips { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
    .chip { min-height: 38px; padding: 0 1rem; border-radius: 999px; border: 1.5px solid var(--line); background: var(--card); cursor: pointer; font-weight: 600; }
    .chip:hover { background: var(--paper-2); }
    .chip--on { background: var(--ink); color: #fff; border-color: var(--ink); }
    @media (max-width: 860px) {
      .hero__inner { grid-template-columns: 1fr; padding-block: 2.5rem; }
      .hero__art { display: none; }
      .perks { grid-template-columns: 1fr; margin-top: 1rem; }
      .hero__search { flex-direction: column; }
    }
  `]
})
export class HomeComponent implements OnInit {
  private readonly itemsApi = inject(ItemService);
  private readonly categoriesApi = inject(CategoryService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly search$ = new Subject<string>();

  readonly categories = signal<Category[]>([]);
  readonly featured = signal<Item[]>([]);
  readonly latest = signal<Item[]>([]);
  readonly items = signal<Item[]>([]);
  readonly meta = signal<PageMeta>({ total: 0, page: 1, limit: 12, pages: 1 });
  readonly loading = signal(true);
  readonly error = signal(false);

  heroQuery = '';
  search = '';
  category = '';
  sort: NonNullable<ItemQuery['sort']> = 'newest';

  ngOnInit(): void {
    this.categoriesApi.list().subscribe({ next: (res) => this.categories.set(res.data), error: () => this.categories.set([]) });
    this.itemsApi.list({ featured: true, limit: 4 }).subscribe({ next: (res) => this.featured.set(res.data), error: () => this.featured.set([]) });
    this.itemsApi.list({ sort: 'newest', limit: 4 }).subscribe({ next: (res) => this.latest.set(res.data), error: () => this.latest.set([]) });
    this.search$.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef)).subscribe(() => this.loadCatalog(1));
    this.loadCatalog();
  }

  loadCatalog(page = 1): void {
    this.loading.set(true);
    this.error.set(false);
    this.itemsApi.list({ search: this.search.trim(), category: this.category, sort: this.sort, page, limit: 12 }).subscribe({
      next: (res) => {
        this.items.set(res.data);
        if (res.meta) this.meta.set(res.meta);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  onSearch(value: string): void {
    this.search = value;
    this.search$.next(value.trim());
  }

  onSort(value: NonNullable<ItemQuery['sort']>): void {
    this.sort = value;
    this.loadCatalog(1);
  }

  pickCategory(id: string): void {
    this.category = id;
    this.loadCatalog(1);
  }

  heroSearch(event: Event): void {
    event.preventDefault();
    this.search = this.heroQuery.trim();
    this.loadCatalog(1);
    document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
  }

  goToPage(page: number): void {
    this.loadCatalog(page);
    document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
  }
}
