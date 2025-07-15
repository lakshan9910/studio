export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  imageUrl: string;
  stock: number;
}

export interface OrderItem extends Product {
  quantity: number;
}
