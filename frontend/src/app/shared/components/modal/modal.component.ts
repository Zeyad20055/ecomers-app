import { Component, ElementRef, HostListener, OnDestroy, OnInit, inject, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { IconComponent } from '../icon/icon.component';

/** Accessible modal: Escape closes, focus moves inside and returns on close, background scroll locked. */
@Component({
  selector: 'app-modal',
  imports: [TranslateModule, IconComponent],
  template: `
    <div class="backdrop" (mousedown)="onBackdrop($event)">
      <div class="dialog" role="dialog" aria-modal="true" [attr.aria-label]="title()" [class.dialog--wide]="wide()" tabindex="-1">
        <header class="dialog__head">
          <h3>{{ title() }}</h3>
          <button type="button" class="icon-btn" (click)="closed.emit()" [attr.aria-label]="'common.close' | translate"><app-icon name="close" /></button>
        </header>
        <div class="dialog__body"><ng-content /></div>
      </div>
    </div>
  `,
  styles: [`
    .backdrop { position: fixed; inset: 0; z-index: 1500; background: rgba(12, 28, 23, 0.55); display: flex; align-items: center; justify-content: center; padding: 16px; animation: fade 0.18s; }
    .dialog { background: var(--card); border-radius: var(--radius); width: 100%; max-width: 520px; max-height: calc(100vh - 32px); display: flex; flex-direction: column; box-shadow: var(--shadow-lg); animation: pop 0.22s var(--ease); outline: none; }
    .dialog--wide { max-width: 760px; }
    .dialog__head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem 1.25rem; border-bottom: 1px solid var(--line); }
    .dialog__head h3 { margin: 0; }
    .dialog__body { padding: 1.25rem; overflow-y: auto; }
    @keyframes fade { from { opacity: 0; } }
    @keyframes pop { from { opacity: 0; transform: translateY(10px) scale(0.98); } }
  `]
})
export class ModalComponent implements OnInit, OnDestroy {
  readonly title = input.required<string>();
  readonly wide = input(false);
  readonly closed = output<void>();

  private readonly host = inject(ElementRef<HTMLElement>);
  private previouslyFocused: HTMLElement | null = null;

  ngOnInit(): void {
    this.previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      const el = this.host.nativeElement as HTMLElement;
      const target = el.querySelector<HTMLElement>('[autofocus], input, select, textarea, .dialog__body button') ?? el.querySelector<HTMLElement>('.dialog');
      target?.focus();
    });
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
    this.previouslyFocused?.focus?.();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closed.emit();
  }

  @HostListener('keydown', ['$event'])
  trapFocus(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const focusable = Array.from(
      (this.host.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]')
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  onBackdrop(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('backdrop')) this.closed.emit();
  }
}
