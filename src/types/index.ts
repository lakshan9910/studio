export interface Product {
  id: string;
  name: string;
  category: string; // This will now be a category ID
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

export interface User {
  id: string;
  email: string;
  name?: string;
}
