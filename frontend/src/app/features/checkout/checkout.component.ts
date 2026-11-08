import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { OrderRequest, PaymentMethod } from '../../core/models/order.model';
import { OrderService } from '../../core/services/order.service';
import { CartLineDetail, CartService } from '../../services/cart.service';
import { LocalStorageService } from '../../services/local-storage.service';
import { NotificationService } from '../../services/notification.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { MoneyPipe } from '../../shared/pipes/money.pipe';

export const LAST_ORDER_KEY = 'lastOrder';
const PENDING_ORDER_REQUEST_ID_KEY = 'pendingOrderRequestId';
const PENDING_ORDER_PAYMENT_METHOD_KEY = 'pendingOrderPaymentMethod';
const PHONE_PATTERN = /^\+?[0-9\s\-()]{7,20}$/;

interface Problem {
  itemId: string;
  name?: string;
  reason: string;
}

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, RouterLink, TranslateModule, IconComponent, LoadingSpinnerComponent, MoneyPipe],
  template: `
    <div class="container section">
      <div class="section__head"><div><span class="eyebrow">{{ 'checkout.eyebrow' | translate }}</span><h1 class="h1-sm">{{ 'checkout.title' | translate }}</h1></div></div>

      @if (loading()) {
        <app-loading-spinner />
      } @else if (failed()) {
        <div class="alert alert--error row row--between">{{ 'errors.loadFailed' | translate }} <button class="btn btn--sm" type="button" (click)="load()">{{ 'common.retry' | translate }}</button></div>
      } @else if (!rows().length) {
        <div class="empty"><app-icon name="cart" [size]="40" /><h3>{{ 'cart.emptyTitle' | translate }}</h3><p>{{ 'cart.emptyText' | translate }}</p><a routerLink="/" class="btn">{{ 'cart.continue' | translate }}</a></div>
      } @else {
        <div class="layout">
          <form class="card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <h3>{{ 'checkout.yourDetails' | translate }}</h3>

            @if (problems().length) {
              <div class="alert alert--error" role="alert" style="margin-bottom:1rem">
                <strong>{{ 'errors.ITEMS_UNAVAILABLE' | translate }}</strong>
                <ul>@for (p of problems(); track p.itemId) { <li>{{ p.name || ('cart.itemGone' | translate) }} — {{ 'errors.reason.' + p.reason | translate }}</li> }</ul>
                <a routerLink="/cart" class="btn btn--sm">{{ 'checkout.backToCart' | translate }}</a>
              </div>
            }

            <div class="form-grid">
              <div class="field">
                <label for="name">{{ 'checkout.fullName' | translate }} *</label>
                <input id="name" class="input" formControlName="customerName" autocomplete="name" [class.invalid]="invalid('customerName')" maxlength="100" />
                @if (invalid('customerName')) { <span class="error-text">{{ 'validation.name' | translate }}</span> }
              </div>
              <div class="field">
                <label for="phone">{{ 'checkout.phone' | translate }} *</label>
                <input id="phone" class="input" type="tel" dir="ltr" formControlName="customerPhone" autocomplete="tel" inputmode="tel" [class.invalid]="invalid('customerPhone')" maxlength="25" />
                @if (invalid('customerPhone')) { <span class="error-text">{{ 'validation.phone' | translate }}</span> }
              </div>
              <div class="field span-2">
                <label for="email">{{ 'checkout.email' | translate }} *</label>
                <input id="email" class="input" type="email" dir="ltr" formControlName="customerEmail" autocomplete="email" required [class.invalid]="invalid('customerEmail')" maxlength="150" />
                @if (invalid('customerEmail')) { <span class="error-text">{{ 'validation.email' | translate }}</span> }
              </div>
              <div class="field span-2">
                <label for="address">{{ 'checkout.address' | translate }} *</label>
                <textarea id="address" class="textarea" rows="3" formControlName="deliveryAddress" autocomplete="street-address" [class.invalid]="invalid('deliveryAddress')" maxlength="500"></textarea>
                @if (invalid('deliveryAddress')) { <span class="error-text">{{ 'validation.address' | translate }}</span> }
              </div>
              <fieldset class="field span-2">
                <legend>{{ 'checkout.paymentMethod' | translate }} *</legend>
                <label class="payment-option"><input type="radio" formControlName="paymentMethod" value="cash_on_delivery" /> {{ 'payment.method.cash_on_delivery' | translate }}</label>
                <label class="payment-option"><input type="radio" formControlName="paymentMethod" value="paymob" /> {{ 'payment.method.paymob' | translate }}</label>
              </fieldset>
              <div class="field span-2">
                <label for="notes">{{ 'checkout.notes' | translate }} <span class="muted">({{ 'common.optional' | translate }})</span></label>
                <textarea id="notes" class="textarea" rows="2" formControlName="customerNotes" maxlength="1000"></textarea>
              </div>
            </div>

            <div class="alert alert--info" style="margin-top:1rem">{{ (form.controls.paymentMethod.value === 'paymob' ? 'checkout.paymobNotice' : 'checkout.phoneNotice') | translate }}</div>

            <button type="submit" class="btn btn--accent btn--block" style="margin-top:1rem" [disabled]="submitting()">
              @if (submitting()) { <app-loading-spinner [inline]="true" /> {{ 'checkout.submitting' | translate }} } @else { {{ 'checkout.placeOrder' | translate }} }
            </button>
          </form>

          <aside class="card summary">
            <h3>{{ 'cart.summary' | translate }}</h3>
            <ul class="lines">
              @for (row of rows(); track row.id) {
                <li class="row row--between">
                  <span>{{ row.item?.name || ('cart.itemGone' | translate) }} <span class="muted">× {{ row.qty }}</span></span>
                  @if (row.item) { <strong>{{ row.item.price * row.qty | money }}</strong> }
                </li>
              }
            </ul>
            <div class="row row--between total"><span>{{ 'cart.total' | translate }}</span><strong>{{ total() | money }}</strong></div>
          </aside>
        </div>
      }
    </div>
  `,
  styles: [`
    .h1-sm { font-size: clamp(1.7rem, 4vw, 2.4rem); margin: 0; }
    .layout { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 1.5rem; align-items: start; }
    .lines { list-style: none; padding: 0; margin: 0 0 0.8rem; display: grid; gap: 0.6rem; }
    .payment-option { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.45rem; }
    fieldset { border: 0; padding: 0; margin: 0; }
    .total { font-size: 1.25rem; padding-top: 0.7rem; border-top: 1px dashed var(--line); }
    .small { font-size: 0.82rem; margin: 0.6rem 0 0; }
    .summary { position: sticky; top: 90px; }
    .alert ul { margin: 0.4rem 0 0.7rem; padding-inline-start: 1.2rem; }
    @media (max-width: 900px) { .layout { grid-template-columns: 1fr; } .summary { position: static; order: -1; } }
  `]
})
export class CheckoutComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly cart = inject(CartService);
  private readonly orders = inject(OrderService);
  private readonly notify = inject(NotificationService);
  private readonly storage = inject(LocalStorageService);
  private readonly router = inject(Router);

  readonly rows = signal<CartLineDetail[]>([]);
  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly submitting = signal(false);
  readonly problems = signal<Problem[]>([]);
  readonly total = computed(() => this.rows().filter((r) => !!r.item && r.item.isAvailable !== false).reduce((s, r) => s + r.item!.price * r.qty, 0));

  /** Same id for retries of an identical submission so the API can detect duplicates. */
  private requestId = this.storage.getString(PENDING_ORDER_REQUEST_ID_KEY) || this.newRequestId();

  readonly form = this.fb.nonNullable.group({
    customerName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    customerPhone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    customerEmail: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    paymentMethod: this.fb.nonNullable.control<PaymentMethod>('cash_on_delivery'),
    deliveryAddress: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]],
    customerNotes: ['', [Validators.maxLength(1000)]]
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.failed.set(false);
    this.cart.loadDetailed().subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      }
    });
  }

  invalid(name: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  submit(): void {
    if (this.submitting()) return; // prevents accidental double submission
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const unavailable = this.rows().filter((r) => !r.item || r.item.isAvailable === false);
    if (unavailable.length) {
      this.problems.set(unavailable.map((r) => ({ itemId: r.id, name: r.item?.name, reason: 'UNAVAILABLE' })));
      return;
    }

    const value = this.form.getRawValue();
    const previousPaymentMethod = this.storage.getString(PENDING_ORDER_PAYMENT_METHOD_KEY);
    // Reusing an idempotency key after changing payment method could return an older order.
    if (previousPaymentMethod !== value.paymentMethod) this.requestId = this.newRequestId();
    const payload: OrderRequest = {
      customerName: value.customerName.trim(),
      customerPhone: value.customerPhone.trim(),
      customerEmail: value.customerEmail.trim(),
      paymentMethod: value.paymentMethod,
      deliveryAddress: value.deliveryAddress.trim(),
      clientRequestId: this.requestId,
      items: this.cart.lines().map((l) => ({ item: l.id, quantity: l.qty }))
    };
    if (value.customerNotes.trim()) payload.customerNotes = value.customerNotes.trim();

    this.storage.set(PENDING_ORDER_REQUEST_ID_KEY, this.requestId);
    this.storage.set(PENDING_ORDER_PAYMENT_METHOD_KEY, value.paymentMethod);
    this.submitting.set(true);
    this.problems.set([]);
    this.orders.create(payload).subscribe({
      next: (res) => {
        this.storage.set(LAST_ORDER_KEY, res.data);
        this.storage.remove(PENDING_ORDER_REQUEST_ID_KEY);
        this.storage.remove(PENDING_ORDER_PAYMENT_METHOD_KEY);
        this.requestId = this.newRequestId();
        this.cart.clear(); // only after the order was created
        if (res.checkoutUrl) {
          window.location.assign(res.checkoutUrl);
          return;
        }
        this.router.navigate(['/order-success']);
      },
      error: (err) => {
        this.submitting.set(false);
        if (err.status >= 400 && err.status < 500) {
          this.requestId = this.newRequestId();
          this.storage.set(PENDING_ORDER_REQUEST_ID_KEY, this.requestId);
        }
        if (err?.error?.code === 'ITEMS_UNAVAILABLE' && Array.isArray(err.error.details)) {
          this.problems.set(err.error.details as Problem[]);
          this.load();
        } else {
          this.notify.httpError(err);
        }
      }
    });
  }

  private newRequestId(): string {
    return typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  }
}
