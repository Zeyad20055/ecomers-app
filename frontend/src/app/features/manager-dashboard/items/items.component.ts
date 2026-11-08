import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { PageMeta } from '../../../core/models/api.model';
import { Category } from '../../../core/models/category.model';
import { Item } from '../../../core/models/item.model';
import { CategoryService } from '../../../core/services/category.service';
import { ItemService } from '../../../core/services/item.service';
import { NotificationService } from '../../../services/notification.service';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { MoneyPipe } from '../../../shared/pipes/money.pipe';
import { ImgFallbackDirective } from '../../../shared/img-fallback.directive';

@Component({
  selector: 'app-items',
  imports: [FormsModule, ReactiveFormsModule, TranslateModule, IconComponent, LoadingSpinnerComponent, ModalComponent, ConfirmationDialogComponent, PaginationComponent, MoneyPipe, ImgFallbackDirective],
  template: `
    <div class="row row--between" style="margin-bottom:1.25rem">
      <h1 class="h1-sm">{{ 'manager.items.title' | translate }}</h1>
      <button type="button" class="btn btn--accent" (click)="openForm(null)" [disabled]="!categories().length"><app-icon name="plus" [size]="18" /> {{ 'manager.items.add' | translate }}</button>
    </div>
    @if (!categories().length && !loading()) { <div class="alert alert--info" style="margin-bottom:1rem">{{ 'manager.items.needCategory' | translate }}</div> }

    <div class="row" style="margin-bottom:1rem">
      <div class="search-box"><app-icon name="search" [size]="18" /><label class="sr-only" for="is">{{ 'common.search' | translate }}</label>
        <input id="is" class="input" type="search" [ngModel]="search" (ngModelChange)="onSearch($event)" [placeholder]="'manager.items.searchPlaceholder' | translate" maxlength="100" /></div>
      <label class="sr-only" for="ic">{{ 'manager.category' | translate }}</label>
      <select id="ic" class="select" style="width:auto" [ngModel]="category" (ngModelChange)="category = $event; load(1)">
        <option value="">{{ 'home.allCategories' | translate }}</option>
        @for (c of categories(); track c._id) { <option [value]="c._id">{{ c.name }}</option> }
      </select>
      <label class="sr-only" for="ia">{{ 'manager.status' | translate }}</label>
      <select id="ia" class="select" style="width:auto" [ngModel]="active" (ngModelChange)="active = $event; load(1)">
        <option value="">{{ 'manager.items.anyStatus' | translate }}</option>
        <option value="true">{{ 'manager.active' | translate }}</option>
        <option value="false">{{ 'manager.inactive' | translate }}</option>
      </select>
    </div>

    @if (loading()) { <app-loading-spinner /> }
    @else if (failed()) { <div class="alert alert--error row row--between">{{ 'errors.loadFailed' | translate }} <button class="btn btn--sm" type="button" (click)="load()">{{ 'common.retry' | translate }}</button></div> }
    @else if (!rows().length) { <div class="empty card"><h3>{{ 'manager.items.emptyTitle' | translate }}</h3><p>{{ 'manager.items.emptyText' | translate }}</p></div> }
    @else {
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>{{ 'manager.image' | translate }}</th><th>{{ 'manager.name' | translate }}</th><th>{{ 'manager.category' | translate }}</th><th>{{ 'manager.price' | translate }}</th><th>{{ 'manager.quantity' | translate }}</th><th>{{ 'manager.status' | translate }}</th><th>{{ 'common.actions' | translate }}</th></tr></thead>
          <tbody>
            @for (i of rows(); track i._id) {
              <tr>
                <td><img class="thumb" [src]="i.image || 'assets/images/placeholder.svg'" appFallback alt="" /></td>
                <td><strong>{{ i.name }}</strong>@if (i.isFeatured) { <span class="badge badge--warn" style="margin-inline-start:0.4rem">{{ 'product.featured' | translate }}</span> }</td>
                <td>{{ i.category.name }}</td>
                <td class="nowrap">{{ i.price | money }}</td>
                <td><span class="badge" [class.badge--danger]="i.quantity === 0" [class.badge--ok]="(i.quantity ?? 0) > 0">{{ i.quantity }}</span></td>
                <td><button type="button" class="badge" [class.badge--ok]="i.isActive" [class.badge--muted]="!i.isActive" style="border:0;cursor:pointer" (click)="toggle(i)" [attr.aria-label]="'manager.toggleStatus' | translate">{{ (i.isActive ? 'manager.active' : 'manager.inactive') | translate }}</button></td>
                <td><div class="actions">
                  <button type="button" class="btn btn--ghost btn--sm" (click)="openForm(i)"><app-icon name="edit" [size]="16" /> {{ 'common.edit' | translate }}</button>
                  <button type="button" class="btn btn--ghost btn--sm" (click)="toDelete.set(i)"><app-icon name="trash" [size]="16" /> {{ 'common.delete' | translate }}</button>
                </div></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <app-pagination [page]="meta().page" [pages]="meta().pages" (pageChange)="load($event)" />
    }

    @if (formOpen()) {
      <app-modal [title]="(editing() ? 'manager.items.edit' : 'manager.items.add') | translate" [wide]="true" (closed)="formOpen.set(false)">
        <form [formGroup]="form" (ngSubmit)="save()" novalidate>
          <div class="form-grid">
            <div class="field span-2"><label for="fn">{{ 'manager.name' | translate }} *</label><input id="fn" class="input" formControlName="name" maxlength="150" [class.invalid]="bad('name')" />
              @if (bad('name')) { <span class="error-text">{{ 'validation.required' | translate }}</span> }</div>
            <div class="field span-2"><label for="fd">{{ 'manager.description' | translate }} *</label><textarea id="fd" class="textarea" rows="3" formControlName="description" maxlength="3000" [class.invalid]="bad('description')"></textarea>
              @if (bad('description')) { <span class="error-text">{{ 'validation.required' | translate }}</span> }</div>
            <div class="field"><label for="fp">{{ 'manager.price' | translate }} *</label><input id="fp" class="input" type="number" step="0.01" min="0" dir="ltr" formControlName="price" [class.invalid]="bad('price')" />
              @if (bad('price')) { <span class="error-text">{{ 'validation.price' | translate }}</span> }</div>
            <div class="field"><label for="fq">{{ 'manager.quantity' | translate }} *</label><input id="fq" class="input" type="number" step="1" min="0" dir="ltr" formControlName="quantity" [class.invalid]="bad('quantity')" />
              @if (bad('quantity')) { <span class="error-text">{{ 'validation.quantity' | translate }}</span> }</div>
            <div class="field"><label for="fc">{{ 'manager.category' | translate }} *</label>
              <select id="fc" class="select" formControlName="category" [class.invalid]="bad('category')">
                <option value="" disabled>{{ 'manager.items.chooseCategory' | translate }}</option>
                @for (c of categories(); track c._id) { <option [value]="c._id">{{ c.name }}</option> }
              </select>
              @if (bad('category')) { <span class="error-text">{{ 'validation.required' | translate }}</span> }</div>
            <div class="field"><label for="fi">{{ 'manager.imageUrl' | translate }}</label><input id="fi" class="input" dir="ltr" formControlName="image" placeholder="https://" [class.invalid]="bad('image')" />
              @if (bad('image')) { <span class="error-text">{{ 'validation.url' | translate }}</span> }</div>
            <label class="check"><input type="checkbox" formControlName="isActive" /> {{ 'manager.active' | translate }}</label>
            <label class="check"><input type="checkbox" formControlName="isFeatured" /> {{ 'product.featured' | translate }}</label>
          </div>
          <div class="row" style="justify-content:flex-end;margin-top:1.25rem">
            <button type="button" class="btn btn--ghost" (click)="formOpen.set(false)">{{ 'common.cancel' | translate }}</button>
            <button type="submit" class="btn" [disabled]="saving()">{{ 'common.save' | translate }}</button>
          </div>
        </form>
      </app-modal>
    }

    @if (toDelete(); as i) {
      <app-confirmation-dialog [title]="'manager.items.deleteTitle' | translate" [message]="'manager.items.deleteMessage' | translate: { name: i.name }" [confirmLabel]="'common.delete' | translate" (confirmed)="remove(i)" (cancelled)="toDelete.set(null)" />
    }
  `,
  styles: [`.h1-sm { font-size: 1.9rem; margin: 0; }`]
})
export class ItemsComponent implements OnInit {
  private readonly api = inject(ItemService);
  private readonly categoriesApi = inject(CategoryService);
  private readonly notify = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly search$ = new Subject<string>();

  readonly rows = signal<Item[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly meta = signal<PageMeta>({ total: 0, page: 1, limit: 10, pages: 1 });
  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly saving = signal(false);
  readonly formOpen = signal(false);
  readonly editing = signal<Item | null>(null);
  readonly toDelete = signal<Item | null>(null);
  search = '';
  category = '';
  active = '';

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    description: ['', [Validators.required, Validators.maxLength(3000)]],
    price: [0, [Validators.required, Validators.min(0)]],
    quantity: [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
    category: ['', [Validators.required]],
    image: ['', [Validators.pattern(/^$|^(https?:\/\/|\/).+/)]],
    isActive: [true],
    isFeatured: [false]
  });

  ngOnInit(): void {
    this.categoriesApi.listManager('', 1, 100).subscribe({ next: (res) => this.categories.set(res.data) });
    this.search$.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef)).subscribe(() => this.load(1));
    this.load();
  }

  load(page = 1): void {
    this.loading.set(true);
    this.failed.set(false);
    this.api.listManager({ search: this.search.trim(), category: this.category, active: this.active === '' ? undefined : this.active === 'true', page, limit: 10 }).subscribe({
      next: (res) => { this.rows.set(res.data); if (res.meta) this.meta.set(res.meta); this.loading.set(false); },
      error: () => { this.failed.set(true); this.loading.set(false); }
    });
  }

  onSearch(v: string): void { this.search = v; this.search$.next(v.trim()); }
  bad(name: keyof typeof this.form.controls): boolean { const c = this.form.controls[name]; return c.invalid && (c.touched || c.dirty); }

  openForm(item: Item | null): void {
    this.editing.set(item);
    this.form.reset({
      name: item?.name ?? '', description: item?.description ?? '', price: item?.price ?? 0, quantity: item?.quantity ?? 0,
      category: item?.category._id ?? '', image: item?.image ?? '', isActive: item?.isActive ?? true, isFeatured: item?.isFeatured ?? false
    });
    this.formOpen.set(true);
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) return;
    const v = this.form.getRawValue();
    const payload = { ...v, name: v.name.trim(), description: v.description.trim(), image: v.image.trim(), price: Number(v.price), quantity: Number(v.quantity) };
    const current = this.editing();
    this.saving.set(true);
    (current ? this.api.update(current._id, payload) : this.api.create(payload)).subscribe({
      next: () => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.notify.success(current ? 'manager.items.updated' : 'manager.items.created');
        this.load(this.meta().page);
      },
      error: (err) => { this.saving.set(false); this.notify.httpError(err); }
    });
  }

  toggle(i: Item): void {
    this.api.update(i._id, { isActive: !i.isActive }).subscribe({
      next: (res) => { this.rows.update((rows) => rows.map((r) => (r._id === i._id ? res.data : r))); this.notify.success('manager.items.updated'); },
      error: (err) => this.notify.httpError(err)
    });
  }

  remove(i: Item): void {
    this.toDelete.set(null);
    this.api.remove(i._id).subscribe({
      next: () => { this.notify.success('manager.items.deleted'); this.load(this.rows().length === 1 && this.meta().page > 1 ? this.meta().page - 1 : this.meta().page); },
      error: (err) => this.notify.httpError(err)
    });
  }
}
