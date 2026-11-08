import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom, Observable } from 'rxjs';
import { LocalStorageService } from './local-storage.service';

export type Lang = 'en' | 'ar';
const STORAGE_KEY = 'lang';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);
  private readonly storage = inject(LocalStorageService);
  private readonly doc = inject(DOCUMENT);

  readonly lang = signal<Lang>('en');
  readonly isRtl = computed(() => this.lang() === 'ar');

  /** Applies the saved language and resolves once its translations are loaded. */
  init(): Promise<unknown> {
    const saved = this.storage.getString(STORAGE_KEY);
    return firstValueFrom(this.apply(saved === 'ar' ? 'ar' : 'en'));
  }

  toggle(): void {
    this.apply(this.lang() === 'en' ? 'ar' : 'en');
  }

  apply(lang: Lang): Observable<unknown> {
    this.lang.set(lang);
    const loaded = this.translate.use(lang);
    this.storage.set(STORAGE_KEY, lang);
    const html = this.doc.documentElement;
    html.lang = lang;
    html.dir = lang === 'ar' ? 'rtl' : 'ltr';
    return loaded;
  }
}
