import { Injectable, computed, inject, signal } from '@angular/core';
import { LocalStorageService } from './local-storage.service';

const KEY = 'favorites';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly storage = inject(LocalStorageService);

  readonly ids = signal<string[]>(this.read());
  readonly count = computed(() => this.ids().length);

  has(id: string): boolean {
    return this.ids().includes(id);
  }

  toggle(id: string): void {
    this.ids.update((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
    this.storage.set(KEY, this.ids());
  }

  remove(id: string): void {
    if (this.has(id)) this.toggle(id);
  }

  private read(): string[] {
    const raw = this.storage.get<unknown>(KEY, []);
    if (!Array.isArray(raw)) return [];
    return [...new Set((raw as unknown[]).filter((v): v is string => typeof v === 'string' && /^[a-f0-9]{24}$/i.test(v)))];
  }
}
