export interface ItemCategoryRef {
  _id: string;
  name: string;
}

/** Public items never include `quantity`. Manager responses do. */
export interface Item {
  _id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  category: ItemCategoryRef;
  isFeatured?: boolean;
  isAvailable?: boolean;
  quantity?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ItemPayload {
  name: string;
  description: string;
  price: number;
  quantity: number;
  category: string;
  image?: string;
  isActive: boolean;
  isFeatured: boolean;
}

export interface ItemQuery {
  search?: string;
  category?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'name';
  featured?: boolean;
  active?: boolean;
  page?: number;
  limit?: number;
}
