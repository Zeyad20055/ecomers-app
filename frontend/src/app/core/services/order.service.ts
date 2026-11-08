import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.model';
import { DashboardStats, Order, OrderQuery, OrderRequest, OrderStatus, OrderSummary } from '../models/order.model';

export interface CreateOrderResponse { success: boolean; data: OrderSummary; checkoutUrl?: string; }

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/orders`;

  /** Public: submit an order request. */
  create(payload: OrderRequest): Observable<CreateOrderResponse> {
    return this.http.post<CreateOrderResponse>(this.base, payload);
  }

  list(query: OrderQuery = {}): Observable<ApiResponse<Order[]>> {
    let params = new HttpParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params = params.set(key, String(value));
    });
    return this.http.get<ApiResponse<Order[]>>(this.base, { params });
  }

  getById(id: string): Observable<ApiResponse<Order>> {
    return this.http.get<ApiResponse<Order>>(`${this.base}/${id}`);
  }

  updateStatus(id: string, status: OrderStatus): Observable<ApiResponse<Order>> {
    return this.http.patch<ApiResponse<Order>>(`${this.base}/${id}/status`, { status });
  }

  updateNotes(id: string, managerNotes: string): Observable<ApiResponse<Order>> {
    return this.http.patch<ApiResponse<Order>>(`${this.base}/${id}/notes`, { managerNotes });
  }

  stats(): Observable<ApiResponse<DashboardStats>> {
    return this.http.get<ApiResponse<DashboardStats>>(`${environment.apiUrl}/dashboard/stats`);
  }
}
