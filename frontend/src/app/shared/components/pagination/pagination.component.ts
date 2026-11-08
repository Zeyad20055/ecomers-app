import { Component, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-pagination',
  imports: [TranslateModule, IconComponent],
  template: `
    @if (pages() > 1) {
      <nav class="pager" [attr.aria-label]="'common.pagination' | translate">
        <button type="button" class="btn btn--ghost btn--sm" [disabled]="page() <= 1" (click)="pageChange.emit(page() - 1)">
          <app-icon name="chevron" [size]="16" class="flip" /> {{ 'common.previous' | translate }}
        </button>
        <span class="pager__info">{{ page() }} / {{ pages() }}</span>
        <button type="button" class="btn btn--ghost btn--sm" [disabled]="page() >= pages()" (click)="pageChange.emit(page() + 1)">
          {{ 'common.next' | translate }} <app-icon name="chevron" [size]="16" class="flip-next" />
        </button>
      </nav>
    }
  `,
  styles: [`
    .pager { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 1.5rem; }
    .pager__info { font-weight: 600; min-width: 4rem; text-align: center; }
    .flip { display: inline-flex; transform: scaleX(-1); }
    :host-context([dir='rtl']) .flip { transform: none; }
    :host-context([dir='rtl']) .flip-next { transform: scaleX(-1); display: inline-flex; }
  `]
})
export class PaginationComponent {
  readonly page = input.required<number>();
  readonly pages = input.required<number>();
  readonly pageChange = output<number>();
}
