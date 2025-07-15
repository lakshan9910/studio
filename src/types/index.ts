
export type UserRole = 'Admin' | 'Cashier';
export type PaymentMethod = 'Cash' | 'Card' | 'Online' | 'Credit';
export type StockAdjustmentType = 'Addition' | 'Subtraction';
export type PaymentStatus = 'Paid' | 'Due' | 'Overdue';

export interface ProductVariant {
  id: string; // Unique ID for the variant, e.g., prod_001-small
  sku: string; // Stock Keeping Unit
  name: string; // e.g., "Small", "Red", "12oz"
  price: number;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  unit: string; // Base unit, might be less relevant with variants
  imageUrl: string;
  variants: ProductVariant[];
}

export interface OrderItem {
  productId: string;
  productName: string;
  variant: ProductVariant;
  quantity: number;
  imageUrl: string;
}

export interface SaleItem {
    productId: string;
    productName: string;
    variantId: string;
    variantName: string;
    quantity: number;
    price: number; // Price per unit at time of sale
}

export interface Sale {
    id: string;
    date: string; // ISO date string
    items: SaleItem[];
    total: number;
    paymentMethod: PaymentMethod;
    customerId?: string;
    customerName?: string;
    // Fields for credit payments
    dueDate?: string; // ISO date string
    paymentStatus?: PaymentStatus;
    paidAmount?: number;
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
  phone?: string;
  imageUrl?: string;
}

export interface PurchaseItem {
  productId: string;
  variantId: string;
  quantity: number;
  cost: number; // Cost per unit
  batchNumber?: string;
  expiryDate?: string; // ISO date string
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
  variantId: string;
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

export interface ExpenseCategory {
    id: string;
    name: string;
    description?: string;
}

export interface Expense {
    id: string;
    date: string; // ISO date string
    categoryId: string;
    description: string;
    amount: number;
}

export interface StockAdjustmentItem {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface StockAdjustment {
  id:string;
  date: string; // ISO date string
  items: StockAdjustmentItem[];
  reason: string;
  type: StockAdjustmentType;
}

    