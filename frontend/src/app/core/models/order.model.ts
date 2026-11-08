export type OrderStatus = 'opened' | 'closed';
export type PaymentMethod = 'cash_on_delivery' | 'paymob';
export type PaymentStatus = 'not_required' | 'pending' | 'paid' | 'failed';

export interface OrderLine {
  item: string;
  itemNameSnapshot: string;
  unitPriceSnapshot: number;
  quantity: number;
  subtotal: number;
}

/** Full order as seen by the manager. */
export interface Order {
  _id: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  deliveryAddress: string;
  items: OrderLine[];
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  customerNotes?: string;
  managerNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderRequest {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  paymentMethod: PaymentMethod;
  deliveryAddress: string;
  customerNotes?: string;
  clientRequestId: string;
  items: { item: string; quantity: number }[];
}

/** What a customer receives after submitting an order. */
export interface OrderSummary {
  orderCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  deliveryAddress: string;
  items: { name: string; unitPrice: number; quantity: number; subtotal: number }[];
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  createdAt: string;
}

export interface DashboardStats {
  activeItems: number;
  totalCategories: number;
  totalOrders: number;
  openedOrders: number;
  closedOrders: number;
  recentOrders: Pick<Order, '_id' | 'orderCode' | 'customerName' | 'customerPhone' | 'totalAmount' | 'currency' | 'status' | 'createdAt'>[];
}

export interface OrderQuery {
  search?: string;
  status?: OrderStatus | '';
  page?: number;
  limit?: number;
}
