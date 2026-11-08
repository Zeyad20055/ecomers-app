import { Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-loading-spinner',
  imports: [TranslateModule],
  template: `
    <div class="spinner-wrap" role="status" [class.inline]="inline()">
      <span class="spinner"></span>
      <span class="sr-only">{{ 'common.loading' | translate }}</span>
    </div>
  `,
  styles: [`
    .spinner-wrap { display: flex; justify-content: center; padding: 3rem 0; }
    .spinner-wrap.inline { padding: 0; display: inline-flex; }
    .spinner { width: 34px; height: 34px; border-radius: 50%; border: 3.5px solid var(--line); border-top-color: var(--accent); animation: spin 0.8s linear infinite; }
    .inline .spinner { width: 18px; height: 18px; border-width: 2.5px; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class LoadingSpinnerComponent {
  readonly inline = input(false);
}
