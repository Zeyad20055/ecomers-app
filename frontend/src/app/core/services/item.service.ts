import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.model';
import { Item, ItemPayload, ItemQuery } from '../models/item.model';

@Injectable({ providedIn: 'root' })
export class ItemService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/items`;

  private params(query: ItemQuery, manager = false): HttpParams {
    let params = new HttpParams();
    if (manager) params = params.set('scope', 'manager');
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params = params.set(key, String(value));
    });
    return params;
  }

  /** Public listing (never contains inventory quantity). */
  list(query: ItemQuery = {}): Observable<ApiResponse<Item[]>> {
    return this.http.get<ApiResponse<Item[]>>(this.base, { params: this.params(query) });
  }

  getById(id: string): Observable<ApiResponse<Item>> {
    return this.http.get<ApiResponse<Item>>(`${this.base}/${id}`);
  }

  /** Manager listing (includes quantity and inactive items). */
  listManager(query: ItemQuery = {}): Observable<ApiResponse<Item[]>> {
    return this.http.get<ApiResponse<Item[]>>(this.base, { params: this.params(query, true) });
  }

  create(payload: ItemPayload): Observable<ApiResponse<Item>> {
    return this.http.post<ApiResponse<Item>>(this.base, payload);
  }

  update(id: string, payload: Partial<ItemPayload>): Observable<ApiResponse<Item>> {
    return this.http.patch<ApiResponse<Item>>(`${this.base}/${id}`, payload);
  }

  remove(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.base}/${id}`);
  }
}
