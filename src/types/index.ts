export type UserRole = 'Admin' | 'Cashier';

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

export interface SaleItem {
    productId: string;
    quantity: number;
    price: number; // Price per unit at time of sale
}

export interface Sale {
    id: string;
    date: string; // ISO date string
    items: SaleItem[];
    total: number;
}

export interface Category {
  id: string;
  name: string;
  imageUrl: string;
}

export interface Brand {
    id: string;
    name: string;
    imageUrl: string;
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
  role: UserRole;
}

export interface PurchaseItem {
  productId: string;
  quantity: number;
  cost: number; // Cost per unit
}

export interface Purchase {
  id: string;
  supplierId: string;
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

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
}
