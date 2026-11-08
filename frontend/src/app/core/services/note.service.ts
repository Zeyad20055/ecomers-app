import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.model';
import { Note } from '../models/note.model';

@Injectable({ providedIn: 'root' })
export class NoteService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/notes`;

  /** Newest first. */
  list(page = 1, limit = 20): Observable<ApiResponse<Note[]>> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<ApiResponse<Note[]>>(this.base, { params });
  }

  create(content: string): Observable<ApiResponse<Note>> {
    return this.http.post<ApiResponse<Note>>(this.base, { content });
  }

  update(noteId: string, content: string): Observable<ApiResponse<Note>> {
    return this.http.patch<ApiResponse<Note>>(`${this.base}/${noteId}`, { content });
  }

  remove(noteId: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.base}/${noteId}`);
  }
}
