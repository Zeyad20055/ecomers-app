import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { PageMeta } from '../../../core/models/api.model';
import { Note } from '../../../core/models/note.model';
import { NoteService } from '../../../core/services/note.service';
import { LanguageService } from '../../../services/language.service';
import { NotificationService } from '../../../services/notification.service';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

const MAX_LENGTH = 5000;
const PAGE_SIZE = 20;

@Component({
  selector: 'app-notes',
  imports: [FormsModule, TranslateModule, IconComponent, LoadingSpinnerComponent, ConfirmationDialogComponent],
  template: `
    <div class="row row--between" style="margin-bottom:1.25rem">
      <h1 class="h1-sm">{{ 'manager.notes.title' | translate }}</h1>
      @if (!loading() && !failed()) { <span class="badge">{{ total() }}</span> }
    </div>

    <form class="card composer stack" (ngSubmit)="add()" novalidate>
      <div class="field">
        <label for="newNote">{{ 'manager.notes.newLabel' | translate }}</label>
        <textarea id="newNote" name="newNote" class="textarea" rows="3" [maxlength]="max"
          [(ngModel)]="draft" [placeholder]="'manager.notes.placeholder' | translate"
          [class.invalid]="draftTouched() && !draft.trim()" (keydown.control.enter)="add()" (keydown.meta.enter)="add()"></textarea>
        @if (draftTouched() && !draft.trim()) { <span class="error-text">{{ 'manager.notes.empty' | translate }}</span> }
      </div>
      <div class="row row--between">
        <span class="muted small">{{ draft.length }} / {{ max }}</span>
        <button type="submit" class="btn btn--accent" [disabled]="adding()"><app-icon name="plus" [size]="18" /> {{ 'manager.notes.add' | translate }}</button>
      </div>
    </form>

    @if (loading()) { <app-loading-spinner /> }
    @else if (failed()) {
      <div class="alert alert--error row row--between">{{ 'errors.loadFailed' | translate }}
        <button class="btn btn--sm" type="button" (click)="load()">{{ 'common.retry' | translate }}</button></div>
    }
    @else if (!notes().length) {
      <div class="empty card"><h3>{{ 'manager.notes.emptyTitle' | translate }}</h3><p>{{ 'manager.notes.emptyText' | translate }}</p></div>
    }
    @else {
      <ul class="list" role="list" [attr.aria-label]="'manager.notes.title' | translate">
        @for (n of notes(); track n.noteId) {
          <li class="note card">
            @if (editingId() === n.noteId) {
              <div class="field">
                <label class="sr-only" [for]="'e-' + n.noteId">{{ 'manager.notes.edit' | translate }}</label>
                <textarea [id]="'e-' + n.noteId" class="textarea" rows="4" [maxlength]="max" [(ngModel)]="editText"
                  [class.invalid]="!editText.trim()" (keydown.escape)="cancelEdit()"></textarea>
                @if (!editText.trim()) { <span class="error-text">{{ 'manager.notes.empty' | translate }}</span> }
              </div>
              <div class="row" style="justify-content:flex-end;margin-top:0.75rem">
                <button type="button" class="btn btn--ghost btn--sm" (click)="cancelEdit()">{{ 'common.cancel' | translate }}</button>
                <button type="button" class="btn btn--sm" [disabled]="saving()" (click)="saveEdit(n)">{{ 'common.save' | translate }}</button>
              </div>
            } @else {
              <p class="note__text">{{ n.content }}</p>
              <div class="note__foot">
                <div class="note__meta muted">
                  <span><app-icon name="user" [size]="14" /> {{ n.createdBy?.name || ('manager.notes.unknownUser' | translate) }}</span>
                  <span><time [attr.datetime]="n.createdAt">{{ fmt(n.createdAt) }}</time></span>
                  @if (isEdited(n)) { <span class="badge badge--muted">{{ 'manager.notes.edited' | translate }} · {{ fmt(n.updatedAt) }}</span> }
                </div>
                <div class="actions">
                  <button type="button" class="btn btn--ghost btn--sm" (click)="startEdit(n)"><app-icon name="edit" [size]="16" /> {{ 'common.edit' | translate }}</button>
                  <button type="button" class="btn btn--ghost btn--sm" (click)="toDelete.set(n)"><app-icon name="trash" [size]="16" /> {{ 'common.delete' | translate }}</button>
                </div>
              </div>
            }
          </li>
        }
      </ul>
      @if (hasMore()) {
        <div class="row" style="justify-content:center;margin-top:1rem">
          <button type="button" class="btn btn--ghost" [disabled]="loadingMore()" (click)="loadMore()">{{ 'manager.notes.loadMore' | translate }}</button>
        </div>
      }
    }

    @if (toDelete(); as n) {
      <app-confirmation-dialog [title]="'manager.notes.deleteTitle' | translate" [message]="'manager.notes.deleteMessage' | translate"
        [confirmLabel]="'common.delete' | translate" (confirmed)="remove(n)" (cancelled)="toDelete.set(null)" />
    }
  `,
  styles: [`
    .h1-sm { font-size: 1.9rem; margin: 0; }
    .composer { margin-bottom: 1.25rem; }
    .small { font-size: 0.85rem; }
    .list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.75rem; max-height: 60vh; overflow-y: auto; padding-inline-end: 0.25rem; }
    .note { padding: 1rem 1.25rem; }
    .note__text { margin: 0 0 0.85rem; white-space: pre-wrap; overflow-wrap: anywhere; }
    .note__foot { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap; }
    .note__meta { display: flex; align-items: center; gap: 0.9rem; flex-wrap: wrap; font-size: 0.85rem; }
    .note__meta span { display: inline-flex; align-items: center; gap: 0.3rem; }
  `]
})
export class NotesComponent implements OnInit {
  private readonly api = inject(NoteService);
  private readonly notify = inject(NotificationService);
  private readonly lang = inject(LanguageService);

  readonly max = MAX_LENGTH;
  readonly notes = signal<Note[]>([]);
  readonly meta = signal<PageMeta>({ total: 0, page: 1, limit: PAGE_SIZE, pages: 1 });
  readonly total = computed(() => this.meta().total);
  readonly hasMore = computed(() => this.notes().length < this.meta().total);
  readonly loading = signal(true);
  readonly loadingMore = signal(false);
  readonly failed = signal(false);
  readonly adding = signal(false);
  readonly saving = signal(false);
  readonly draftTouched = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly toDelete = signal<Note | null>(null);
  draft = '';
  editText = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.failed.set(false);
    this.api.list(1, PAGE_SIZE).subscribe({
      next: (res) => { this.notes.set(res.data); if (res.meta) this.meta.set(res.meta); this.loading.set(false); },
      error: () => { this.failed.set(true); this.loading.set(false); }
    });
  }

  loadMore(): void {
    if (this.loadingMore()) return;
    // Offset-based paging can repeat items if notes were added meanwhile, so de-duplicate by noteId.
    const next = Math.floor(this.notes().length / PAGE_SIZE) + 1;
    this.loadingMore.set(true);
    this.api.list(next, PAGE_SIZE).subscribe({
      next: (res) => {
        const seen = new Set(this.notes().map((n) => n.noteId));
        this.notes.update((list) => [...list, ...res.data.filter((n) => !seen.has(n.noteId))]);
        if (res.meta) this.meta.set(res.meta);
        this.loadingMore.set(false);
      },
      error: (err) => { this.loadingMore.set(false); this.notify.httpError(err); }
    });
  }

  add(): void {
    this.draftTouched.set(true);
    const content = this.draft.trim();
    if (!content || this.adding()) return;
    this.adding.set(true);
    this.api.create(content).subscribe({
      next: (res) => {
        this.notes.update((list) => [res.data, ...list]);
        this.meta.update((m) => ({ ...m, total: m.total + 1 }));
        this.draft = '';
        this.draftTouched.set(false);
        this.adding.set(false);
        this.notify.success('manager.notes.created');
      },
      error: (err) => { this.adding.set(false); this.notify.httpError(err); }
    });
  }

  startEdit(n: Note): void {
    this.editingId.set(n.noteId);
    this.editText = n.content;
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.editText = '';
  }

  saveEdit(n: Note): void {
    const content = this.editText.trim();
    if (!content || this.saving()) return;
    if (content === n.content) { this.cancelEdit(); return; }
    this.saving.set(true);
    this.api.update(n.noteId, content).subscribe({
      next: (res) => {
        this.notes.update((list) => list.map((x) => (x.noteId === n.noteId ? res.data : x)));
        this.saving.set(false);
        this.cancelEdit();
        this.notify.success('manager.notes.updated');
      },
      error: (err) => { this.saving.set(false); this.notify.httpError(err); }
    });
  }

  remove(n: Note): void {
    this.toDelete.set(null);
    this.api.remove(n.noteId).subscribe({
      next: () => {
        this.notes.update((list) => list.filter((x) => x.noteId !== n.noteId));
        this.meta.update((m) => ({ ...m, total: Math.max(0, m.total - 1) }));
        if (this.editingId() === n.noteId) this.cancelEdit();
        this.notify.success('manager.notes.deleted');
      },
      error: (err) => {
        // Already deleted elsewhere: drop it from the list instead of leaving a stale row.
        if (err?.error?.code === 'NOTE_NOT_FOUND') this.notes.update((list) => list.filter((x) => x.noteId !== n.noteId));
        this.notify.httpError(err);
      }
    });
  }

  isEdited(n: Note): boolean {
    return new Date(n.updatedAt).getTime() - new Date(n.createdAt).getTime() > 1000;
  }

  /** UTC ISO string from the API -> the viewer's local date and time, in the active UI language. */
  fmt(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat(this.lang.lang() === 'ar' ? 'ar-EG' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
  }
}
