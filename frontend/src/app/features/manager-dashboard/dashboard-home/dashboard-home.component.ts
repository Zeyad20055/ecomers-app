import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DashboardStats } from '../../../core/models/order.model';
import { OrderService } from '../../../core/services/order.service';
import { LanguageService } from '../../../services/language.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { MoneyPipe } from '../../../shared/pipes/money.pipe';

@Component({
  selector: 'app-dashboard-home',
  imports: [RouterLink, DatePipe, TranslateModule, IconComponent, LoadingSpinnerComponent, MoneyPipe],
  template: `
    <h1 class="h1-sm">{{ 'manager.dashboard.title' | translate }}</h1>
    @if (loading()) {
      <app-loading-spinner />
    } @else if (failed()) {
      <div class="alert alert--error row row--between">{{ 'errors.loadFailed' | translate }} <button class="btn btn--sm" type="button" (click)="load()">{{ 'common.retry' | translate }}</button></div>
    } @else {
      @if (stats(); as s) {
      <div class="stats">
        <a class="card stat" routerLink="/manager/dashboard/items"><app-icon name="box" /><span class="stat__n">{{ s.activeItems }}</span><span class="muted">{{ 'manager.dashboard.activeItems' | translate }}</span></a>
        <a class="card stat" routerLink="/manager/dashboard/categories"><app-icon name="tag" /><span class="stat__n">{{ s.totalCategories }}</span><span class="muted">{{ 'manager.dashboard.categories' | translate }}</span></a>
        <a class="card stat" routerLink="/manager/dashboard/orders"><app-icon name="receipt" /><span class="stat__n">{{ s.totalOrders }}</span><span class="muted">{{ 'manager.dashboard.totalOrders' | translate }}</span></a>
        <a class="card stat stat--warn" routerLink="/manager/dashboard/orders"><app-icon name="phone" /><span class="stat__n">{{ s.openedOrders }}</span><span class="muted">{{ 'manager.dashboard.openedOrders' | translate }}</span></a>
        <a class="card stat stat--ok" routerLink="/manager/dashboard/orders"><app-icon name="check" /><span class="stat__n">{{ s.closedOrders }}</span><span class="muted">{{ 'manager.dashboard.closedOrders' | translate }}</span></a>
      </div>

      <h2 class="h2-sm">{{ 'manager.dashboard.recent' | translate }}</h2>
      @if (!s.recentOrders.length) {
        <div class="empty card">{{ 'manager.orders.empty' | translate }}</div>
      } @else {
        <div class="table-wrap">
          <table class="table">
            <thead><tr><th>{{ 'manager.orders.code' | translate }}</th><th>{{ 'manager.orders.customer' | translate }}</th><th>{{ 'manager.orders.total' | translate }}</th><th>{{ 'manager.orders.status' | translate }}</th><th>{{ 'manager.orders.date' | translate }}</th></tr></thead>
            <tbody>
              @for (o of s.recentOrders; track o._id) {
                <tr>
                  <td dir="ltr"><strong>{{ o.orderCode }}</strong></td>
                  <td>{{ o.customerName }}<br /><a [href]="'tel:' + o.customerPhone" class="muted" dir="ltr">{{ o.customerPhone }}</a></td>
                  <td class="nowrap">{{ o.totalAmount | money: o.currency }}</td>
                  <td><span class="badge" [class.badge--warn]="o.status === 'opened'" [class.badge--ok]="o.status === 'closed'">{{ 'status.' + o.status | translate }}</span></td>
                  <td class="nowrap">{{ o.createdAt | date: 'medium' : undefined : lang.lang() }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
      }
    }
  `,
  styles: [`
    .h1-sm { font-size: 1.9rem; margin-bottom: 1.25rem; }
    .h2-sm { font-size: 1.3rem; margin: 2rem 0 1rem; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 1rem; }
    .stat { display: grid; gap: 0.15rem; text-decoration: none; color: var(--accent); transition: transform 0.15s var(--ease); }
    .stat:hover { transform: translateY(-2px); }
    .stat--warn { color: var(--warn); } .stat--ok { color: var(--ok); }
    .stat__n { font-family: var(--font-display); font-size: 2.4rem; font-weight: 700; color: var(--ink); line-height: 1.1; }
  `]
})
export class DashboardHomeComponent implements OnInit {
  private readonly api = inject(OrderService);
  readonly lang = inject(LanguageService);
  readonly stats = signal<DashboardStats | null>(null);
  readonly loading = signal(true);
  readonly failed = signal(false);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.failed.set(false);
    this.api.stats().subscribe({
      next: (res) => { this.stats.set(res.data); this.loading.set(false); },
      error: () => { this.failed.set(true); this.loading.set(false); }
    });
  }
}
