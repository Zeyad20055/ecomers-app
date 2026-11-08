import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, throwError } from 'rxjs';
import { Item } from '../core/models/item.model';
import { ItemService } from '../core/services/item.service';
import { LocalStorageService } from './local-storage.service';

export interface CartLine {
  id: string;
  qty: number;
}

export interface CartLineDetail extends CartLine {
  item: Item | null; // null when the item was deleted or deactivated
}

export const MAX_QTY = 99;
const KEY = 'cart';

/**
 * The cart only stores item ids and quantities. Prices and availability are always
 * re-fetched from the API for display, and recomputed by the backend at checkout.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly storage = inject(LocalStorageService);
  private readonly items = inject(ItemService);

  readonly lines = signal<CartLine[]>(this.read());
  readonly count = computed(() => this.lines().reduce((sum, l) => sum + l.qty, 0));

  add(id: string, qty = 1): void {
    this.lines.update((lines) => {
      const found = lines.find((l) => l.id === id);
      if (found) return lines.map((l) => (l.id === id ? { ...l, qty: this.clamp(l.qty + qty) } : l));
      return [...lines, { id, qty: this.clamp(qty) }];
    });
    this.persist();
  }

  setQty(id: string, qty: number): void {
    this.lines.update((lines) => lines.map((l) => (l.id === id ? { ...l, qty: this.clamp(qty) } : l)));
    this.persist();
  }

  remove(id: string): void {
    this.lines.update((lines) => lines.filter((l) => l.id !== id));
    this.persist();
  }

  clear(): void {
    this.lines.set([]);
    this.persist();
  }

  qtyOf(id: string): number {
    return this.lines().find((l) => l.id === id)?.qty ?? 0;
  }

  /** Current item data for every cart line (404 => item: null). */
  loadDetailed(): Observable<CartLineDetail[]> {
    const lines = this.lines();
    if (!lines.length) return of([]);
    return forkJoin(
      lines.map((line) =>
        this.items.getById(line.id).pipe(
          map((res) => ({ ...line, item: res.data }) as CartLineDetail),
          catchError((err) => (err.status === 404 ? of({ ...line, item: null } as CartLineDetail) : throwError(() => err)))
        )
      )
    );
  }

  private clamp(qty: number): number {
    const n = Math.floor(Number(qty));
    return Number.isFinite(n) ? Math.min(MAX_QTY, Math.max(1, n)) : 1;
  }

  private persist(): void {
    this.storage.set(KEY, this.lines());
  }

  private read(): CartLine[] {
    const raw = this.storage.get<unknown>(KEY, []);
    if (!Array.isArray(raw)) return [];
    const seen = new Set<string>();
    const valid: CartLine[] = [];
    for (const entry of raw as Partial<CartLine>[]) {
      if (
        entry && typeof entry.id === 'string' && /^[a-f0-9]{24}$/i.test(entry.id) &&
        typeof entry.qty === 'number' && Number.isInteger(entry.qty) && entry.qty >= 1 && entry.qty <= MAX_QTY &&
        !seen.has(entry.id)
      ) {
        seen.add(entry.id);
        valid.push({ id: entry.id, qty: entry.qty });
      }
    }
    return valid;
  }
}
