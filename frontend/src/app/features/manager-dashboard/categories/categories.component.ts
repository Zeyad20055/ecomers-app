import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { PageMeta } from '../../../core/models/api.model';
import { Category } from '../../../core/models/category.model';
import { CategoryService } from '../../../core/services/category.service';
import { NotificationService } from '../../../services/notification.service';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { ImgFallbackDirective } from '../../../shared/img-fallback.directive';

@Component({
  selector: 'app-categories',
  imports: [FormsModule, ReactiveFormsModule, TranslateModule, IconComponent, LoadingSpinnerComponent, ModalComponent, ConfirmationDialogComponent, PaginationComponent, ImgFallbackDirective],
  template: `
    <div class="row row--between" style="margin-bottom:1.25rem">
      <h1 class="h1-sm">{{ 'manager.categories.title' | translate }}</h1>
      <button type="button" class="btn btn--accent" (click)="openForm(null)"><app-icon name="plus" [size]="18" /> {{ 'manager.categories.add' | translate }}</button>
    </div>

    <div class="row" style="margin-bottom:1rem">
      <div class="search-box"><app-icon name="search" [size]="18" /><label class="sr-only" for="cs">{{ 'common.search' | translate }}</label>
        <input id="cs" class="input" type="search" [ngModel]="search" (ngModelChange)="onSearch($event)" [placeholder]="'manager.categories.searchPlaceholder' | translate" maxlength="100" /></div>
    </div>

    @if (loading()) { <app-loading-spinner /> }
    @else if (failed()) { <div class="alert alert--error row row--between">{{ 'errors.loadFailed' | translate }} <button class="btn btn--sm" type="button" (click)="load()">{{ 'common.retry' | translate }}</button></div> }
    @else if (!rows().length) { <div class="empty card"><h3>{{ 'manager.categories.emptyTitle' | translate }}</h3><p>{{ 'manager.categories.emptyText' | translate }}</p></div> }
    @else {
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>{{ 'manager.image' | translate }}</th><th>{{ 'manager.name' | translate }}</th><th>{{ 'manager.description' | translate }}</th><th>{{ 'manager.status' | translate }}</th><th>{{ 'common.actions' | translate }}</th></tr></thead>
          <tbody>
            @for (c of rows(); track c._id) {
              <tr>
                <td><img class="thumb" [src]="c.image || 'assets/images/placeholder.svg'" appFallback alt="" /></td>
                <td><strong>{{ c.name }}</strong></td>
                <td class="muted">{{ c.description }}</td>
                <td><button type="button" class="badge" [class.badge--ok]="c.isActive" [class.badge--muted]="!c.isActive" style="border:0;cursor:pointer" (click)="toggle(c)" [attr.aria-label]="'manager.toggleStatus' | translate">{{ (c.isActive ? 'manager.active' : 'manager.inactive') | translate }}</button></td>
                <td><div class="actions">
                  <button type="button" class="btn btn--ghost btn--sm" (click)="openForm(c)"><app-icon name="edit" [size]="16" /> {{ 'common.edit' | translate }}</button>
                  <button type="button" class="btn btn--ghost btn--sm" (click)="toDelete.set(c)"><app-icon name="trash" [size]="16" /> {{ 'common.delete' | translate }}</button>
                </div></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <app-pagination [page]="meta().page" [pages]="meta().pages" (pageChange)="load($event)" />
    }

    @if (formOpen()) {
      <app-modal [title]="(editing() ? 'manager.categories.edit' : 'manager.categories.add') | translate" (closed)="formOpen.set(false)">
        <form [formGroup]="form" (ngSubmit)="save()" novalidate class="stack">
          <div class="field"><label for="cn">{{ 'manager.name' | translate }} *</label><input id="cn" class="input" formControlName="name" maxlength="80" [class.invalid]="bad('name')" />
            @if (bad('name')) { <span class="error-text">{{ 'validation.required' | translate }}</span> }</div>
          <div class="field"><label for="cd">{{ 'manager.description' | translate }}</label><textarea id="cd" class="textarea" rows="3" formControlName="description" maxlength="500"></textarea></div>
          <div class="field"><label for="ci">{{ 'manager.imageUrl' | translate }}</label><input id="ci" class="input" dir="ltr" formControlName="image" placeholder="https://" [class.invalid]="bad('image')" />
            @if (bad('image')) { <span class="error-text">{{ 'validation.url' | translate }}</span> }</div>
          <label class="check"><input type="checkbox" formControlName="isActive" /> {{ 'manager.active' | translate }}</label>
          <div class="row" style="justify-content:flex-end">
            <button type="button" class="btn btn--ghost" (click)="formOpen.set(false)">{{ 'common.cancel' | translate }}</button>
            <button type="submit" class="btn" [disabled]="saving()">{{ 'common.save' | translate }}</button>
          </div>
        </form>
      </app-modal>
    }

    @if (toDelete(); as c) {
      <app-confirmation-dialog [title]="'manager.categories.deleteTitle' | translate" [message]="('manager.categories.deleteMessage' | translate: { name: c.name })" [confirmLabel]="'common.delete' | translate" (confirmed)="remove(c)" (cancelled)="toDelete.set(null)" />
    }
  `,
  styles: [`.h1-sm { font-size: 1.9rem; margin: 0; }`]
})
export class CategoriesComponent implements OnInit {
  private readonly api = inject(CategoryService);
  private readonly notify = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly search$ = new Subject<string>();

  readonly rows = signal<Category[]>([]);
  readonly meta = signal<PageMeta>({ total: 0, page: 1, limit: 10, pages: 1 });
  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly saving = signal(false);
  readonly formOpen = signal(false);
  readonly editing = signal<Category | null>(null);
  readonly toDelete = signal<Category | null>(null);
  search = '';

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    description: ['', [Validators.maxLength(500)]],
    image: ['', [Validators.pattern(/^$|^(https?:\/\/|\/).+/)]],
    isActive: [true]
  });

  ngOnInit(): void {
    this.search$.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef)).subscribe(() => this.load(1));
    this.load();
  }

  load(page = 1): void {
    this.loading.set(true);
    this.failed.set(false);
    this.api.listManager(this.search.trim(), page, 10).subscribe({
      next: (res) => { this.rows.set(res.data); if (res.meta) this.meta.set(res.meta); this.loading.set(false); },
      error: () => { this.failed.set(true); this.loading.set(false); }
    });
  }

  onSearch(v: string): void { this.search = v; this.search$.next(v.trim()); }
  bad(name: 'name' | 'image'): boolean { const c = this.form.controls[name]; return c.invalid && (c.touched || c.dirty); }

  openForm(cat: Category | null): void {
    this.editing.set(cat);
    this.form.reset({ name: cat?.name ?? '', description: cat?.description ?? '', image: cat?.image ?? '', isActive: cat?.isActive ?? true });
    this.formOpen.set(true);
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) return;
    const v = this.form.getRawValue();
    const payload = { name: v.name.trim(), description: v.description.trim(), image: v.image.trim(), isActive: v.isActive };
    const current = this.editing();
    this.saving.set(true);
    (current ? this.api.update(current._id, payload) : this.api.create(payload)).subscribe({
      next: () => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.notify.success(current ? 'manager.categories.updated' : 'manager.categories.created');
        this.load(this.meta().page);
      },
      error: (err) => { this.saving.set(false); this.notify.httpError(err); }
    });
  }

  toggle(c: Category): void {
    this.api.update(c._id, { isActive: !c.isActive }).subscribe({
      next: (res) => { this.rows.update((rows) => rows.map((r) => (r._id === c._id ? res.data : r))); this.notify.success('manager.categories.updated'); },
      error: (err) => this.notify.httpError(err)
    });
  }

  remove(c: Category): void {
    this.toDelete.set(null);
    this.api.remove(c._id).subscribe({
      next: () => { this.notify.success('manager.categories.deleted'); this.load(this.rows().length === 1 && this.meta().page > 1 ? this.meta().page - 1 : this.meta().page); },
      error: (err) => this.notify.httpError(err)
    });
  }
}
