export interface PageMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PageMeta;
}

export interface Manager {
  _id: string;
  name: string;
  email: string;
  role: 'manager';
}
