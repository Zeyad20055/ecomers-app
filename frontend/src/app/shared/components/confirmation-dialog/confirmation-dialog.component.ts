import { Component, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-confirmation-dialog',
  imports: [ModalComponent, TranslateModule],
  template: `
    <app-modal [title]="title()" (closed)="cancelled.emit()">
      <p>{{ message() }}</p>
      <div class="row" style="justify-content:flex-end;margin-top:1rem">
        <button type="button" class="btn btn--ghost" (click)="cancelled.emit()">{{ 'common.cancel' | translate }}</button>
        <button type="button" class="btn" [class.btn--danger]="danger()" (click)="confirmed.emit()" autofocus>{{ confirmLabel() || ('common.confirm' | translate) }}</button>
      </div>
    </app-modal>
  `
})
export class ConfirmationDialogComponent {
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmLabel = input('');
  readonly danger = input(true);
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
}
