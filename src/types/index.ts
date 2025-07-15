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
