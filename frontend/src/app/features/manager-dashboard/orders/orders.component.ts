import { DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { PageMeta } from '../../../core/models/api.model';
import { Order, OrderStatus } from '../../../core/models/order.model';
import { OrderService } from '../../../core/services/order.service';
import { LanguageService } from '../../../services/language.service';
import { NotificationService } from '../../../services/notification.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { MoneyPipe } from '../../../shared/pipes/money.pipe';

@Component({
  selector: 'app-orders',
  imports: [DatePipe, FormsModule, TranslateModule, IconComponent, LoadingSpinnerComponent, ModalComponent, PaginationComponent, MoneyPipe],
  template: `
    <h1 class="h1-sm">{{ 'manager.orders.title' | translate }}</h1>

    <div class="row" style="margin-bottom:1rem">
      <div class="search-box"><app-icon name="search" [size]="18" /><label class="sr-only" for="os">{{ 'common.search' | translate }}</label>
        <input id="os" class="input" type="search" [ngModel]="search" (ngModelChange)="onSearch($event)" [placeholder]="'manager.orders.searchPlaceholder' | translate" maxlength="100" /></div>
      <label class="sr-only" for="ost">{{ 'manager.orders.status' | translate }}</label>
      <select id="ost" class="select" style="width:auto" [ngModel]="status" (ngModelChange)="status = $event; load(1)">
        <option value="">{{ 'manager.orders.allStatuses' | translate }}</option>
        <option value="opened">{{ 'status.opened' | translate }}</option>
        <option value="closed">{{ 'status.closed' | translate }}</option>
      </select>
    </div>

    @if (loading()) { <app-loading-spinner /> }
    @else if (failed()) { <div class="alert alert--error row row--between">{{ 'errors.loadFailed' | translate }} <button class="btn btn--sm" type="button" (click)="load()">{{ 'common.retry' | translate }}</button></div> }
    @else if (!rows().length) { <div class="empty card"><h3>{{ 'manager.orders.empty' | translate }}</h3></div> }
    @else {
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>{{ 'manager.orders.code' | translate }}</th><th>{{ 'manager.orders.customer' | translate }}</th><th>{{ 'manager.orders.total' | translate }}</th><th>{{ 'manager.orders.status' | translate }}</th><th>{{ 'manager.orders.date' | translate }}</th><th>{{ 'common.actions' | translate }}</th></tr></thead>
          <tbody>
            @for (o of rows(); track o._id) {
              <tr>
                <td dir="ltr"><strong>{{ o.orderCode }}</strong></td>
                <td>{{ o.customerName }}<br /><a [href]="'tel:' + o.customerPhone" dir="ltr" class="tel">{{ o.customerPhone }}</a></td>
                <td class="nowrap">{{ o.totalAmount | money: o.currency }}</td>
                <td><span class="badge" [class.badge--warn]="o.status === 'opened'" [class.badge--ok]="o.status === 'closed'">{{ 'status.' + o.status | translate }}</span></td>
                <td class="nowrap">{{ o.createdAt | date: 'medium' : undefined : lang.lang() }}</td>
                <td><button type="button" class="btn btn--ghost btn--sm" (click)="open(o)"><app-icon name="eye" [size]="16" /> {{ 'manager.orders.view' | translate }}</button></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <app-pagination [page]="meta().page" [pages]="meta().pages" (pageChange)="load($event)" />
    }

    @if (selected(); as o) {
      <app-modal [title]="('manager.orders.details' | translate) + ' ' + o.orderCode" [wide]="true" (closed)="selected.set(null)">
        <div class="stack" style="--gap:1.25rem">
          <div class="row row--between">
            <span class="badge" [class.badge--warn]="o.status === 'opened'" [class.badge--ok]="o.status === 'closed'">{{ 'status.' + o.status | translate }}</span>
            <button type="button" class="btn btn--sm" [disabled]="busy()" (click)="setStatus(o, o.status === 'opened' ? 'closed' : 'opened')">
              {{ (o.status === 'opened' ? 'manager.orders.markClosed' : 'manager.orders.reopen') | translate }}
            </button>
          </div>

          <div class="info">
            <div><span class="muted">{{ 'checkout.fullName' | translate }}</span><strong>{{ o.customerName }}</strong></div>
            <div><span class="muted">{{ 'checkout.phone' | translate }}</span><a class="btn btn--accent btn--sm" [href]="'tel:' + o.customerPhone" dir="ltr"><app-icon name="phone" [size]="16" /> {{ o.customerPhone }}</a></div>
            @if (o.customerEmail) { <div><span class="muted">{{ 'checkout.email' | translate }}</span><a [href]="'mailto:' + o.customerEmail" dir="ltr">{{ o.customerEmail }}</a></div> }
            <div><span class="muted">{{ 'manager.orders.date' | translate }}</span><strong>{{ o.createdAt | date: 'medium' : undefined : lang.lang() }}</strong></div>
            <div><span class="muted">{{ 'checkout.paymentMethod' | translate }}</span><strong>{{ ('payment.method.' + (o.paymentMethod || 'cash_on_delivery')) | translate }} — {{ ('payment.status.' + (o.paymentStatus || 'not_required')) | translate }}</strong></div>
            <div class="span"><span class="muted">{{ 'checkout.address' | translate }}</span><strong>{{ o.deliveryAddress }}</strong></div>
          </div>

          <div class="table-wrap">
            <table class="table">
              <thead><tr><th>{{ 'manager.orders.product' | translate }}</th><th>{{ 'manager.orders.unitPrice' | translate }}</th><th>{{ 'manager.orders.qty' | translate }}</th><th>{{ 'manager.orders.subtotal' | translate }}</th></tr></thead>
              <tbody>
                @for (l of o.items; track $index) {
                  <tr><td>{{ l.itemNameSnapshot }}</td><td class="nowrap">{{ l.unitPriceSnapshot | money: o.currency }}</td><td>{{ l.quantity }}</td><td class="nowrap">{{ l.subtotal | money: o.currency }}</td></tr>
                }
              </tbody>
            </table>
          </div>
          <div class="row row--between"><strong>{{ 'cart.total' | translate }}</strong><strong class="big">{{ o.totalAmount | money: o.currency }}</strong></div>

          <div class="notes notes--customer">
            <h3>{{ 'manager.orders.customerNotes' | translate }}</h3>
            <p>{{ o.customerNotes || ('manager.orders.noNotes' | translate) }}</p>
          </div>

          <div class="notes notes--internal">
            <label for="mn"><h3>{{ 'manager.orders.managerNotes' | translate }} <span class="badge badge--muted">{{ 'manager.orders.internal' | translate }}</span></h3></label>
            <textarea id="mn" class="textarea" rows="3" [(ngModel)]="notes" maxlength="2000"></textarea>
            <div class="row" style="justify-content:flex-end;margin-top:0.5rem">
              <button type="button" class="btn btn--sm" [disabled]="busy() || notes === (o.managerNotes || '')" (click)="saveNotes(o)">{{ 'manager.orders.saveNotes' | translate }}</button>
            </div>
          </div>
        </div>
      </app-modal>
    }
  `,
  styles: [`
    .h1-sm { font-size: 1.9rem; margin: 0 0 1.25rem; }
    .tel { color: var(--accent); font-weight: 600; text-decoration: none; }
    .info { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.9rem 1.5rem; }
    .info div { display: flex; flex-direction: column; gap: 0.2rem; align-items: flex-start; }
    .info .span { grid-column: span 2; }
    .big { font-size: 1.4rem; }
    .notes { border-radius: var(--radius-sm); padding: 0.9rem 1rem; }
    .notes h3 { font-size: 0.95rem; margin: 0 0 0.4rem; display: flex; gap: 0.5rem; align-items: center; }
    .notes p { margin: 0; white-space: pre-line; }
    .notes--customer { background: var(--paper-2); border-inline-start: 4px solid var(--ink); }
    .notes--internal { background: var(--warn-soft); border-inline-start: 4px solid var(--warn); }
    @media (max-width: 600px) { .info { grid-template-columns: 1fr; } .info .span { grid-column: auto; } }
  `]
})
export class OrdersComponent implements OnInit {
  private readonly api = inject(OrderService);
  private readonly notify = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly search$ = new Subject<string>();
  readonly lang = inject(LanguageService);

  readonly rows = signal<Order[]>([]);
  readonly meta = signal<PageMeta>({ total: 0, page: 1, limit: 10, pages: 1 });
  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly busy = signal(false);
  readonly selected = signal<Order | null>(null);
  search = '';
  status: OrderStatus | '' = '';
  notes = '';

  ngOnInit(): void {
    this.search$.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef)).subscribe(() => this.load(1));
    this.load();
  }

  load(page = 1): void {
    this.loading.set(true);
    this.failed.set(false);
    this.api.list({ search: this.search.trim(), status: this.status, page, limit: 10 }).subscribe({
      next: (res) => { this.rows.set(res.data); if (res.meta) this.meta.set(res.meta); this.loading.set(false); },
      error: () => { this.failed.set(true); this.loading.set(false); }
    });
  }

  onSearch(v: string): void { this.search = v; this.search$.next(v.trim()); }

  open(order: Order): void {
    this.notes = order.managerNotes ?? '';
    this.selected.set(order);
  }

  setStatus(order: Order, status: OrderStatus): void {
    this.busy.set(true);
    this.api.updateStatus(order._id, status).subscribe({
      next: (res) => { this.replace(res.data); this.busy.set(false); this.notify.success('manager.orders.statusUpdated'); },
      error: (err) => { this.busy.set(false); this.notify.httpError(err); }
    });
  }

  saveNotes(order: Order): void {
    this.busy.set(true);
    this.api.updateNotes(order._id, this.notes.trim()).subscribe({
      next: (res) => { this.replace(res.data); this.notes = res.data.managerNotes ?? ''; this.busy.set(false); this.notify.success('manager.orders.notesSaved'); },
      error: (err) => { this.busy.set(false); this.notify.httpError(err); }
    });
  }

  private replace(updated: Order): void {
    this.selected.set(updated);
    this.rows.update((rows) => rows.map((r) => (r._id === updated._id ? updated : r)));
  }
}
