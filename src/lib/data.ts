import type { Product, Category, Brand, Unit, Purchase, Return, Sale, Customer } from '@/types';

export const initialProducts: Product[] = [
  {
    id: 'prod_001',
    name: 'Organic Apples',
    category: 'cat_01',
    brand: 'brand_01',
    unit: 'unit_02',
    price: 2.99,
    imageUrl: 'https://placehold.co/300x300.png',
    stock: 150,
  },
  {
    id: 'prod_002',
    name: 'Ripe Bananas',
    category: 'cat_01',
    brand: 'brand_01',
    unit: 'unit_02',
    price: 1.49,
    imageUrl: 'https://placehold.co/300x300.png',
    stock: 200,
  },
  {
    id: 'prod_003',
    name: 'Sourdough Bread',
    category: 'cat_02',
    brand: 'brand_02',
    unit: 'unit_01',
    price: 5.49,
    imageUrl: 'https://placehold.co/300x300.png',
    stock: 50,
  },
  {
    id: 'prod_004',
    name: 'Butter Croissant',
    category: 'cat_02',
    brand: 'brand_02',
    unit: 'unit_01',
    price: 3.25,
    imageUrl: 'https://placehold.co/300x300.png',
    stock: 80,
  },
  {
    id: 'prod_005',
    name: 'Whole Milk',
    category: 'cat_03',
    brand: 'brand_03',
    unit: 'unit_03',
    price: 3.89,
    imageUrl: 'https://placehold.co/300x300.png',
    stock: 100,
  },
  {
    id: 'prod_006',
    name: 'Cheddar Cheese Block',
    category: 'cat_03',
    brand: 'brand_03',
    unit: 'unit_01',
    price: 6.99,
    imageUrl: 'https://placehold.co/300x300.png',
    stock: 75,
  },
  {
    id: 'prod_007',
    name: 'Kettle-Cooked Chips',
    category: 'cat_04',
    brand: 'brand_04',
    unit: 'unit_01',
    price: 4.79,
    imageUrl: 'https://placehold.co/300x300.png',
    stock: 120,
  },
  {
    id: 'prod_008',
    name: 'Dark Chocolate Bar',
    category: 'cat_04',
    brand: 'brand_05',
    unit: 'unit_01',
    price: 3.99,
    imageUrl: 'https://placehold.co/300x300.png',
    stock: 90,
  },
  {
    id: 'prod_009',
    name: 'Avocado',
    category: 'cat_01',
    brand: 'brand_01',
    unit: 'unit_01',
    price: 1.99,
    imageUrl: 'https://placehold.co/300x300.png',
    stock: 110,
  },
  {
    id: 'prod_010',
    name: 'Baguette',
    category: 'cat_02',
    brand: 'brand_02',
    unit: 'unit_01',
    price: 2.79,
    imageUrl: 'https://placehold.co/300x300.png',
    stock: 60,
  },
  {
    id: 'prod_011',
    name: 'Greek Yogurt',
    category: 'cat_03',
    brand: 'brand_03',
    unit: 'unit_01',
    price: 4.49,
    imageUrl: 'https://placehold.co/300x300.png',
    stock: 85,
  },
  {
    id: 'prod_012',
    name: 'Salted Pretzels',
    category: 'cat_04',
    brand: 'brand_04',
    unit: 'unit_01',
    price: 3.29,
    imageUrl: 'https://placehold.co/300x300.png',
    stock: 150,
  },
];


export const initialCategories: Category[] = [
    { id: 'cat_01', name: 'Fresh Produce' },
    { id: 'cat_02', name: 'Bakery' },
    { id: 'cat_03', name: 'Dairy' },
    { id: 'cat_04', name: 'Snacks' },
];

export const initialBrands: Brand[] = [
    { id: 'brand_01', name: 'FarmFresh' },
    { id: 'brand_02', name: 'Bakery Co.' },
    { id: 'brand_03', name: 'Happy Cow Dairy' },
    { id: 'brand_04', name: 'Snacktastic' },
    { id: 'brand_05', name: 'ChocoGood' },
];

export const initialUnits: Unit[] = [
    { id: 'unit_01', name: 'Piece', abbreviation: 'pc' },
    { id: 'unit_02', name: 'Kilogram', abbreviation: 'kg' },
    { id: 'unit_03', name: 'Liter', abbreviation: 'ltr' },
    { id: 'unit_04', name: 'Pack', abbreviation: 'pk' },
];

export const initialPurchases: Purchase[] = [
    {
        id: 'purch_001',
        supplier: 'FarmFresh Suppliers',
        date: '2024-07-20T10:00:00Z',
        items: [
            { productId: 'prod_001', quantity: 50, cost: 1.50 },
            { productId: 'prod_002', quantity: 100, cost: 0.75 },
            { productId: 'prod_009', quantity: 80, cost: 1.00 },
        ],
        totalCost: 235.00,
        status: 'Completed',
    },
     {
        id: 'purch_002',
        supplier: 'Bakery Co. Distributors',
        date: '2024-07-22T14:30:00Z',
        items: [
            { productId: 'prod_003', quantity: 20, cost: 3.00 },
            { productId: 'prod_004', quantity: 50, cost: 1.80 },
            { productId: 'prod_010', quantity: 40, cost: 1.50 },
        ],
        totalCost: 210.00,
        status: 'Completed',
    },
    {
        id: 'purch_003',
        supplier: 'Happy Cow Dairy',
        date: '2024-07-23T09:00:00Z',
        items: [
            { productId: 'prod_005', quantity: 60, cost: 2.20 },
            { productId: 'prod_006', quantity: 40, cost: 4.50 },
            { productId: 'prod_011', quantity: 50, cost: 2.50 },
        ],
        totalCost: 437.00,
        status: 'Completed',
    }
];

export const initialReturns: Return[] = [
    {
        id: 'ret_001',
        customerName: 'John Doe',
        date: '2024-07-25T11:00:00Z',
        items: [
            { productId: 'prod_005', quantity: 1, reason: 'Expired' },
        ],
        totalValue: 3.89,
        status: 'Completed'
    }
];

export const initialSales: Sale[] = [
    {
        id: 'sale_001',
        date: '2024-07-28T10:30:00Z',
        items: [
            { productId: 'prod_001', quantity: 2, price: 2.99 },
            { productId: 'prod_003', quantity: 1, price: 5.49 },
        ],
        total: 11.47
    },
    {
        id: 'sale_002',
        date: '2024-07-28T12:15:00Z',
        items: [
            { productId: 'prod_005', quantity: 1, price: 3.89 },
            { productId: 'prod_006', quantity: 1, price: 6.99 },
            { productId: 'prod_007', quantity: 2, price: 4.79 },
        ],
        total: 20.46
    },
    {
        id: 'sale_003',
        date: '2024-07-29T15:00:00Z',
        items: [
            { productId: 'prod_002', quantity: 5, price: 1.49 },
            { productId: 'prod_012', quantity: 3, price: 3.29 },
        ],
        total: 17.32
    },
    {
        id: 'sale_004',
        date: '2024-07-30T18:45:00Z',
        items: [
            { productId: 'prod_008', quantity: 4, price: 3.99 },
        ],
        total: 15.96
    }
];

export const initialCustomers: Customer[] = [
  { id: 'cust_001', name: 'Alice Johnson', email: 'alice@example.com', phone: '123-456-7890' },
  { id: 'cust_002', name: 'Bob Williams', email: 'bob@example.com', phone: '234-567-8901' },
  { id: 'cust_003', name: 'Charlie Brown', email: 'charlie@example.com', phone: '345-678-9012' },
];
