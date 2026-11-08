import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { catchError, forkJoin, map, of, throwError } from 'rxjs';
import { Item } from '../../core/models/item.model';
import { ItemService } from '../../core/services/item.service';
import { FavoritesService } from '../../services/favorites.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';

interface FavoriteEntry {
  id: string;
  item: Item | null; // null => deleted or inactive
}

@Component({
  selector: 'app-favorites',
  imports: [RouterLink, TranslateModule, IconComponent, LoadingSpinnerComponent, ProductCardComponent],
  template: `
    <div class="container section">
      <div class="section__head"><div><span class="eyebrow">{{ 'favorites.eyebrow' | translate }}</span><h1 class="h1-sm">{{ 'favorites.title' | translate }}</h1></div></div>

      @if (loading()) {
        <app-loading-spinner />
      } @else if (failed()) {
        <div class="alert alert--error row row--between">{{ 'errors.loadFailed' | translate }} <button class="btn btn--sm" type="button" (click)="load()">{{ 'common.retry' | translate }}</button></div>
      } @else if (!visible().length) {
        <div class="empty"><app-icon name="heart" [size]="40" /><h3>{{ 'favorites.emptyTitle' | translate }}</h3><p>{{ 'favorites.emptyText' | translate }}</p><a routerLink="/" class="btn">{{ 'favorites.browse' | translate }}</a></div>
      } @else {
        <div class="grid-products">
          @for (entry of visible(); track entry.id) {
            @if (entry.item; as it) {
              <app-product-card [item]="it" />
            } @else {
              <div class="gone card">
                <app-icon name="close" [size]="28" />
                <p>{{ 'favorites.gone' | translate }}</p>
                <button type="button" class="btn btn--ghost btn--sm" (click)="favorites.remove(entry.id)"><app-icon name="trash" [size]="16" /> {{ 'common.remove' | translate }}</button>
              </div>
            }
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .h1-sm { font-size: clamp(1.7rem, 4vw, 2.4rem); margin: 0; }
    .gone { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 0.5rem; color: var(--muted); min-height: 280px; }
  `]
})
export class FavoritesComponent implements OnInit {
  private readonly api = inject(ItemService);
  readonly favorites = inject(FavoritesService);

  private readonly loaded = signal<FavoriteEntry[]>([]);
  readonly loading = signal(true);
  readonly failed = signal(false);
  /** Reacts immediately to removals made on this page. */
  readonly visible = computed(() => this.loaded().filter((e) => this.favorites.has(e.id)));

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const ids = this.favorites.ids();
    this.loading.set(true);
    this.failed.set(false);
    if (!ids.length) {
      this.loaded.set([]);
      this.loading.set(false);
      return;
    }
    forkJoin(
      ids.map((id) =>
        this.api.getById(id).pipe(
          map((res) => ({ id, item: res.data }) as FavoriteEntry),
          catchError((err) => (err.status === 404 ? of({ id, item: null } as FavoriteEntry) : throwError(() => err)))
        )
      )
    ).subscribe({
      next: (entries) => {
        this.loaded.set(entries);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      }
    });
  }
}
