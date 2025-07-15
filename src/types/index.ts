export interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  unit: string;
  price: number;
  imageUrl: string;
  stock: number;
}

export interface OrderItem extends Product {
  quantity: number;
}

export interface Category {
  id: string;
  name: string;
}

export interface Brand {
    id: string;
    name: string;
}

export interface Unit {
    id: string;
    name: string;
    abbreviation: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface PurchaseItem {
  productId: string;
  quantity: number;
  cost: number; // Cost per unit
}

export interface Purchase {
  id: string;
  supplier: string;
  date: string; // ISO date string
  items: PurchaseItem[];
  totalCost: number;
  status: 'Pending' | 'Completed' | 'Cancelled';
}

export interface ReturnItem {
  productId: string;
  quantity: number;
  reason: string;
}

export interface Return {
  id: string;
  customerName: string; 
  date: string; // ISO date string
  items: ReturnItem[];
  totalValue: number;
  status: 'Pending' | 'Completed' | 'Cancelled';
}
