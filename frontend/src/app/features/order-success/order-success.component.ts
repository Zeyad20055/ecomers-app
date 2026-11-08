import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../environments/environment';
import { OrderSummary } from '../../core/models/order.model';
import { LanguageService } from '../../services/language.service';
import { LocalStorageService } from '../../services/local-storage.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { LAST_ORDER_KEY } from '../checkout/checkout.component';

@Component({
  selector: 'app-order-success',
  imports: [RouterLink, DatePipe, TranslateModule, IconComponent, MoneyPipe],
  template: `
    <div class="container section">
      @if (order(); as o) {
        <div class="card done">
          <div class="done__icon"><app-icon name="check" [size]="34" /></div>
          <h1 class="h1-sm">{{ 'success.title' | translate }}</h1>
          <p class="muted">{{ 'success.subtitle' | translate }}</p>

          <div class="code"><span class="muted">{{ 'success.orderCode' | translate }}</span><strong dir="ltr">{{ o.orderCode }}</strong></div>

          @if (o.paymentMethod === 'paymob') {
            <div class="alert alert--info">{{ 'success.paymobProcess' | translate }}</div>
          } @else {
            <div class="alert alert--info"><app-icon name="phone" [size]="18" /> {{ 'success.phoneProcess' | translate }}</div>
          }

          <div class="cols">
            <div>
              <h3>{{ 'success.details' | translate }}</h3>
              <dl>
                <dt>{{ 'checkout.fullName' | translate }}</dt><dd>{{ o.customerName }}</dd>
                <dt>{{ 'checkout.phone' | translate }}</dt><dd dir="ltr">{{ o.customerPhone }}</dd>
                <dt>{{ 'checkout.email' | translate }}</dt><dd dir="ltr">{{ o.customerEmail }}</dd>
                <dt>{{ 'checkout.address' | translate }}</dt><dd>{{ o.deliveryAddress }}</dd>
                <dt>{{ 'success.placedOn' | translate }}</dt><dd>{{ o.createdAt | date: 'medium' : undefined : lang.lang() }}</dd>
              </dl>
            </div>
            <div>
              <h3>{{ 'cart.summary' | translate }}</h3>
              <ul class="lines">
                @for (line of o.items; track $index) {
                  <li class="row row--between"><span>{{ line.name }} <span class="muted">× {{ line.quantity }}</span></span><strong>{{ line.subtotal | money: o.currency }}</strong></li>
                }
              </ul>
              <div class="row row--between total"><span>{{ 'cart.total' | translate }}</span><strong>{{ o.totalAmount | money: o.currency }}</strong></div>
            </div>
          </div>

          <p>{{ 'success.callUs' | translate }} <a [href]="'tel:' + phone" class="tel" dir="ltr">{{ phone }}</a></p>
          <a routerLink="/" class="btn">{{ 'success.backHome' | translate }}</a>
        </div>
      }
    </div>
  `,
  styles: [`
    .h1-sm { font-size: clamp(1.7rem, 4vw, 2.4rem); }
    .done { max-width: 860px; margin-inline: auto; text-align: center; display: grid; gap: 1rem; justify-items: center; padding: 2rem 1.5rem; }
    .done__icon { width: 72px; height: 72px; border-radius: 50%; background: var(--ok-soft); color: var(--ok); display: grid; place-items: center; animation: pop 0.5s var(--ease); }
    @keyframes pop { from { transform: scale(0.4); opacity: 0; } }
    .code { display: grid; gap: 0.2rem; background: var(--paper-2); border: 1px dashed var(--ink); padding: 0.8rem 1.6rem; border-radius: var(--radius); }
    .code strong { font-size: 1.6rem; letter-spacing: 0.08em; }
    .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; width: 100%; text-align: start; }
    dl { display: grid; gap: 0.2rem; margin: 0; }
    dt { color: var(--muted); font-size: 0.82rem; margin-top: 0.6rem; }
    dd { margin: 0; font-weight: 600; }
    .lines { list-style: none; padding: 0; margin: 0 0 0.8rem; display: grid; gap: 0.5rem; }
    .total { font-size: 1.2rem; padding-top: 0.6rem; border-top: 1px dashed var(--line); }
    .tel { font-weight: 700; color: var(--accent); }
    @media (max-width: 700px) { .cols { grid-template-columns: 1fr; gap: 1rem; } }
  `]
})
export class OrderSuccessComponent implements OnInit {
  private readonly storage = inject(LocalStorageService);
  private readonly router = inject(Router);
  readonly lang = inject(LanguageService);
  readonly phone = environment.storePhone;
  readonly order = signal<OrderSummary | null>(null);

  ngOnInit(): void {
    const last = this.storage.get<OrderSummary | null>(LAST_ORDER_KEY, null);
    if (!last || typeof last.orderCode !== 'string' || !Array.isArray(last.items)) {
      this.router.navigate(['/']);
      return;
    }
    this.order.set(last);
  }
}
