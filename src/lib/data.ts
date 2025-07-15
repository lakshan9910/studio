
import type { Product, Category, Brand, Unit, Purchase, Return, Sale, Customer, Supplier, Expense, ExpenseCategory, StockAdjustment } from '@/types';

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
    { id: 'cat_01', name: 'Fresh Produce', imageUrl: 'https://placehold.co/200x200.png' },
    { id: 'cat_02', name: 'Bakery', imageUrl: 'https://placehold.co/200x200.png' },
    { id: 'cat_03', name: 'Dairy', imageUrl: 'https://placehold.co/200x200.png' },
    { id: 'cat_04', name: 'Snacks', imageUrl: 'https://placehold.co/200x200.png' },
];

export const initialBrands: Brand[] = [
    { id: 'brand_01', name: 'FarmFresh', imageUrl: 'https://placehold.co/200x200.png' },
    { id: 'brand_02', name: 'Bakery Co.', imageUrl: 'https://placehold.co/200x200.png' },
    { id: 'brand_03', name: 'Happy Cow Dairy', imageUrl: 'https://placehold.co/200x200.png' },
    { id: 'brand_04', name: 'Snacktastic', imageUrl: 'https://placehold.co/200x200.png' },
    { id: 'brand_05', name: 'ChocoGood', imageUrl: 'https://placehold.co/200x200.png' },
];

export const initialUnits: Unit[] = [
    { id: 'unit_01', name: 'Piece', abbreviation: 'pc' },
    { id: 'unit_02', name: 'Kilogram', abbreviation: 'kg' },
    { id: 'unit_03', name: 'Liter', abbreviation: 'ltr' },
    { id: 'unit_04', name: 'Pack', abbreviation: 'pk' },
];

export const initialSuppliers: Supplier[] = [
    { id: 'sup_01', name: 'FarmFresh Suppliers', contactPerson: 'John Appleseed', email: 'supplies@farmfresh.com', phone: '111-222-3333' },
    { id: 'sup_02', name: 'Bakery Co. Distributors', contactPerson: 'Jane Dough', email: 'orders@bakeryco.com', phone: '444-555-6666'},
    { id: 'sup_03', name: 'Global Foods Inc.', contactPerson: 'Peter Piper', email: 'peter@globalfoods.com', phone: '777-888-9999'}
];

export const initialPurchases: Purchase[] = [
    {
        id: 'purch_001',
        supplierId: 'sup_01',
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
        supplierId: 'sup_02',
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
        supplierId: 'sup_03',
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

export const initialCustomers: Customer[] = [
  { id: 'cust_001', name: 'Alice Johnson', email: 'alice@example.com', phone: '123-456-7890' },
  { id: 'cust_002', name: 'Bob Williams', email: 'bob@example.com', phone: '234-567-8901' },
  { id: 'cust_003', name: 'Charlie Brown', email: 'charlie@example.com', phone: '345-678-9012' },
];

export const initialSales: Sale[] = [
    {
        id: 'sale_001',
        date: '2024-07-28T10:30:00Z',
        items: [
            { productId: 'prod_001', name: 'Organic Apples', quantity: 2, price: 2.99 },
            { productId: 'prod_003', name: 'Sourdough Bread', quantity: 1, price: 5.49 },
        ],
        total: 11.47,
        paymentMethod: 'Card',
        customerId: 'cust_001',
        customerName: 'Alice Johnson',
    },
    {
        id: 'sale_002',
        date: '2024-07-28T12:15:00Z',
        items: [
            { productId: 'prod_005', name: 'Whole Milk', quantity: 1, price: 3.89 },
            { productId: 'prod_006', name: 'Cheddar Cheese Block', quantity: 1, price: 6.99 },
            { productId: 'prod_007', name: 'Kettle-Cooked Chips', quantity: 2, price: 4.79 },
        ],
        total: 20.46,
        paymentMethod: 'Cash',
        customerId: 'cust_002',
        customerName: 'Bob Williams',
    },
    {
        id: 'sale_003',
        date: '2024-07-29T15:00:00Z',
        items: [
            { productId: 'prod_002', name: 'Ripe Bananas', quantity: 5, price: 1.49 },
            { productId: 'prod_012', name: 'Salted Pretzels', quantity: 3, price: 3.29 },
        ],
        total: 17.32,
        paymentMethod: 'Cash',
        customerName: 'Walk-in Customer'
    },
    {
        id: 'sale_004',
        date: '2024-07-30T18:45:00Z',
        items: [
            { productId: 'prod_008', name: 'Dark Chocolate Bar', quantity: 4, price: 3.99 },
        ],
        total: 15.96,
        paymentMethod: 'Online',
        customerId: 'cust_003',
        customerName: 'Charlie Brown',
    }
];

export const initialExpenseCategories: ExpenseCategory[] = [
    { id: 'exp_cat_01', name: 'Utilities', description: 'Monthly utility bills like electricity, water, internet.' },
    { id: 'exp_cat_02', name: 'Rent', description: 'Payments for store or office space.' },
    { id: 'exp_cat_03', name: 'Marketing', description: 'Costs for advertising and promotion.' },
    { id: 'exp_cat_04', name: 'Salaries', description: 'Payments to employees.' },
];

export const initialExpenses: Expense[] = [
    { id: 'exp_001', date: '2024-07-15T00:00:00Z', categoryId: 'exp_cat_01', description: 'Monthly electricity bill', amount: 125.50 },
    { id: 'exp_002', date: '2024-07-20T00:00:00Z', categoryId: 'exp_cat_02', description: 'Store rental for July', amount: 1500.00 },
    { id: 'exp_003', date: '2024-07-22T00:00:00Z', categoryId: 'exp_cat_03', description: 'Social media ad campaign', amount: 75.00 },
];

export const initialStockAdjustments: StockAdjustment[] = [
  {
    id: 'adj_001',
    date: '2024-07-26T09:00:00Z',
    items: [
      { productId: 'prod_001', quantity: 5 },
    ],
    reason: 'Damaged during shipment',
    type: 'Subtraction',
  },
  {
    id: 'adj_002',
    date: '2024-07-27T14:00:00Z',
    items: [
      { productId: 'prod_003', quantity: 2 },
    ],
    reason: 'Manual stock recount correction',
    type: 'Addition',
  }
];
