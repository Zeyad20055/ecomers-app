import { CurrencyPipe } from '@angular/common';
import { Pipe, PipeTransform, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { LanguageService } from '../../services/language.service';

/** Formats an amount with the configured store currency and the active language's locale. */
@Pipe({ name: 'money', pure: false })
export class MoneyPipe implements PipeTransform {
  private readonly lang = inject(LanguageService);
  private readonly currency = new CurrencyPipe('en');

  transform(value: number | null | undefined, code: string = environment.currency): string {
    return this.currency.transform(value ?? 0, code, 'symbol', '1.2-2', this.lang.lang()) ?? '';
  }
}
