
import type { Product, Category, Brand, Unit, Purchase, Return, Sale, Customer, Supplier, Expense, ExpenseCategory, StockAdjustment, Warehouse, StockTransfer, EmployeeSalary, Attendance, Loan } from '@/types';
import { subDays, subMonths } from 'date-fns';

export const initialWarehouses: Warehouse[] = [
    { id: 'wh_01', name: 'Main Warehouse', location: '123 Warehouse St, Big City' },
    { id: 'wh_02', name: 'Downtown Store', location: '456 Main St, Downtown' },
    { id: 'wh_03', name: 'North Branch', location: '789 North Ave, Suburbia' },
];

export const initialProducts: Product[] = [
  {
    id: 'prod_001',
    name: 'Organic Apples',
    category: 'cat_01',
    brand: 'brand_01',
    unit: 'unit_02',
    imageUrl: 'https://placehold.co/300x300.png',
    variants: [
      { id: 'prod_001-kg', sku: 'FR-APP-KG', name: 'Per Kg', price: 2.99, stock: 150 },
      { id: 'prod_001-bag', sku: 'FR-APP-BG', name: 'Bag (2kg)', price: 5.49, stock: 50 },
    ],
  },
  {
    id: 'prod_002',
    name: 'Ripe Bananas',
    category: 'cat_01',
    brand: 'brand_01',
    unit: 'unit_02',
    imageUrl: 'https://placehold.co/300x300.png',
    variants: [
      { id: 'prod_002-kg', sku: 'FR-BAN-KG', name: 'Per Kg', price: 1.49, stock: 200 }
    ],
  },
  {
    id: 'prod_003',
    name: 'Sourdough Bread',
    category: 'cat_02',
    brand: 'brand_02',
    unit: 'unit_01',
    imageUrl: 'https://placehold.co/300x300.png',
    variants: [
      { id: 'prod_003-loaf', sku: 'BK-SDB-LF', name: 'Loaf', price: 5.49, stock: 50 }
    ],
  },
  {
    id: 'prod_004',
    name: 'Butter Croissant',
    category: 'cat_02',
    brand: 'brand_02',
    unit: 'unit_01',
    imageUrl: 'https://placehold.co/300x300.png',
    variants: [
      { id: 'prod_004-pc', sku: 'BK-CRS-PC', name: 'Piece', price: 3.25, stock: 80 }
    ],
  },
  {
    id: 'prod_005',
    name: 'Whole Milk',
    category: 'cat_03',
    brand: 'brand_03',
    unit: 'unit_03',
    imageUrl: 'https://placehold.co/300x300.png',
    variants: [
      { id: 'prod_005-1l', sku: 'DR-MLK-1L', name: '1 Liter', price: 3.89, stock: 100 },
      { id: 'prod_005-2l', sku: 'DR-MLK-2L', name: '2 Liter', price: 6.99, stock: 40 },
    ],
  },
  {
    id: 'prod_006',
    name: 'Cheddar Cheese Block',
    category: 'cat_03',
    brand: 'brand_03',
    unit: 'unit_01',
    imageUrl: 'https://placehold.co/300x300.png',
    variants: [
      { id: 'prod_006-250g', sku: 'DR-CHD-250G', name: '250g', price: 6.99, stock: 75 }
    ],
  },
  {
    id: 'prod_007',
    name: 'Kettle-Cooked Chips',
    category: 'cat_04',
    brand: 'brand_04',
    unit: 'unit_01',
    imageUrl: 'https://placehold.co/300x300.png',
    variants: [
      { id: 'prod_007-reg', sku: 'SN-CHP-REG', name: 'Regular', price: 4.79, stock: 120 }
    ],
  },
  {
    id: 'prod_008',
    name: 'Dark Chocolate Bar',
    category: 'cat_04',
    brand: 'brand_05',
    unit: 'unit_01',
    imageUrl: 'https://placehold.co/300x300.png',
    variants: [
      { id: 'prod_008-70pct', sku: 'SN-DCB-70', name: '70% Cacao', price: 3.99, stock: 90 },
      { id: 'prod_008-85pct', sku: 'SN-DCB-85', name: '85% Cacao', price: 4.49, stock: 60 },
    ],
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
            { productId: 'prod_001', variantId: 'prod_001-kg', quantity: 50, cost: 1.50, batchNumber: 'BT-1A', expiryDate: '2025-01-01' },
            { productId: 'prod_005', variantId: 'prod_005-1l', quantity: 100, cost: 2.10, batchNumber: 'BT-2B', expiryDate: '2024-10-15' },
        ],
        totalCost: 285.00,
        status: 'Completed',
    },
];

export const initialReturns: Return[] = [
    {
        id: 'ret_001',
        customerName: 'John Doe',
        date: '2024-07-25T11:00:00Z',
        items: [
            { productId: 'prod_005', variantId: 'prod_005-1l', quantity: 1, reason: 'Expired' },
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
            { productId: 'prod_001', productName: 'Organic Apples', variantId: 'prod_001-kg', variantName: 'Per Kg', quantity: 2, price: 2.99 },
            { productId: 'prod_003', productName: 'Sourdough Bread', variantId: 'prod_003-loaf', variantName: 'Loaf', quantity: 1, price: 5.49 },
        ],
        total: 11.47,
        paymentMethod: 'Card',
        customerId: 'cust_001',
        customerName: 'Alice Johnson',
        paymentStatus: 'Paid',
        paidAmount: 11.47,
    },
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
      { productId: 'prod_001', variantId: 'prod_001-kg', quantity: 5 },
    ],
    reason: 'Damaged during shipment',
    type: 'Subtraction',
  },
];

export const initialStockTransfers: StockTransfer[] = [
    {
        id: 'trans_001',
        date: '2024-07-29T14:00:00Z',
        fromWarehouseId: 'wh_01',
        toWarehouseId: 'wh_02',
        items: [
            { productId: 'prod_001', variantId: 'prod_001-bag', quantity: 10 },
            { productId: 'prod_004', variantId: 'prod_004-pc', quantity: 20 },
        ],
        status: 'Completed',
        notes: 'Restocking for downtown store weekly.',
    }
];

export const initialSalaries: EmployeeSalary[] = [
    { 
        userId: 'user_admin_1', 
        baseSalary: 5000, 
        allowances: [
            { name: 'Housing', amount: 500 },
            { name: 'Transport', amount: 150 }
        ],
        deductions: [
            { name: 'Provident Fund', amount: 250 }
        ]
    },
    { 
        userId: 'user_cashier_1', 
        baseSalary: 3000,
        allowances: [
            { name: 'Transport', amount: 100 }
        ],
        deductions: []
    },
];


export const initialAttendance: Attendance[] = [
    { id: 'att_01', userId: 'user_admin_1', date: subDays(new Date(), 2).toISOString().split('T')[0], status: 'Present' },
    { id: 'att_02', userId: 'user_cashier_1', date: subDays(new Date(), 2).toISOString().split('T')[0], status: 'Present' },
    { id: 'att_03', userId: 'user_admin_1', date: subDays(new Date(), 1).toISOString().split('T')[0], status: 'Present' },
    { id: 'att_04', userId: 'user_cashier_1', date: subDays(new Date(), 1).toISOString().split('T')[0], status: 'Absent' },
];

export const initialLoans: Loan[] = [
    {
        id: 'loan_01',
        userId: 'user_cashier_1',
        amount: 1000,
        reason: 'Personal emergency',
        issueDate: subMonths(new Date(), 2).toISOString(),
        monthlyInstallment: 250,
        status: 'Active',
        repayments: [
            { id: 'rep_01', date: subMonths(new Date(), 1).toISOString(), amount: 250, method: 'Payroll' },
            { id: 'rep_02', date: new Date().toISOString(), amount: 250, method: 'Payroll' },
        ]
    },
     {
        id: 'loan_02',
        userId: 'user_admin_1',
        amount: 500,
        reason: 'Salary Advance',
        issueDate: subDays(new Date(), 10).toISOString(),
        monthlyInstallment: 500,
        status: 'Paid Off',
        repayments: [
            { id: 'rep_03', date: new Date().toISOString(), amount: 500, method: 'Payroll' },
        ]
    }
];
