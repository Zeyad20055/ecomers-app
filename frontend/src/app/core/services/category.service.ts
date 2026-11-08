import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.model';
import { Category, CategoryPayload } from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/categories`;

  /** Public: active categories only. */
  list(): Observable<ApiResponse<Category[]>> {
    return this.http.get<ApiResponse<Category[]>>(this.base);
  }

  /** Manager: all categories, with search and pagination. */
  listManager(search = '', page = 1, limit = 100): Observable<ApiResponse<Category[]>> {
    let params = new HttpParams().set('scope', 'manager').set('page', page).set('limit', limit);
    if (search) params = params.set('search', search);
    return this.http.get<ApiResponse<Category[]>>(this.base, { params });
  }

  create(payload: CategoryPayload): Observable<ApiResponse<Category>> {
    return this.http.post<ApiResponse<Category>>(this.base, payload);
  }

  update(id: string, payload: Partial<CategoryPayload>): Observable<ApiResponse<Category>> {
    return this.http.patch<ApiResponse<Category>>(`${this.base}/${id}`, payload);
  }

  remove(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.base}/${id}`);
  }
}
