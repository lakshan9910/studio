

export const permissionGroups = [
  {
    name: 'Point of Sale (POS)',
    permissions: [
      { id: 'pos:read', label: 'Access POS interface' },
      { id: 'pos:write', label: 'Process sales and payments' },
    ],
  },
  {
    name: 'Product Management',
    permissions: [
      { id: 'products:read', label: 'View products, categories, brands' },
      { id: 'products:write', label: 'Create/edit products, categories, brands' },
    ],
  },
  {
    name: 'Inventory & Stock',
    permissions: [
      { id: 'stock:read', label: 'View stock levels, transfers, adjustments' },
      { id: 'stock:write', label: 'Create transfers and adjustments' },
      { id: 'purchases:read', label: 'View purchase orders' },
      { id: 'purchases:write', label: 'Create/edit purchase orders' },
      { id: 'returns:read', label: 'View sales returns' },
      { id: 'returns:write', label: 'Create/edit sales returns' },
    ],
  },
  {
    name: 'Reporting & Analytics',
    permissions: [
      { id: 'reports:read', label: 'View sales and financial reports' },
      { id: 'payments:read', label: 'View payment history' },
    ],
  },
  {
    name: 'User & Supplier Management',
    permissions: [
      { id: 'users:read', label: 'View users and their permissions' },
      { id: 'users:write', label: 'Create/edit users and permissions' },
      { id: 'suppliers:read', label: 'View suppliers' },
      { id: 'suppliers:write', label: 'Create/edit suppliers' },
    ],
  },
  {
    name: 'Financial Management',
    permissions: [
        { id: 'expenses:read', label: 'View expenses' },
        { id: 'expenses:write', label: 'Create/edit expenses' },
        { id: 'cashdrawer:read', label: 'View cash drawer sessions' },
        { id: 'cashdrawer:write', label: 'Manage cash drawer (start/end/adjust)' },
    ]
  },
  {
    name: 'Human Resources',
    permissions: [
      { id: 'hr:read', label: 'View attendance and payroll' },
      { id: 'hr:write', label: 'Manage attendance and run payroll' },
    ],
  },
  {
    name: 'System Settings',
    permissions: [
      { id: 'settings:write', label: 'Change system-wide settings' },
      { id: 'admin', label: 'Full administrative access (overrides all)' },
    ],
  },
] as const;

// Flatten the permissions into a single array of IDs
const allPermissionIds = permissionGroups.flatMap(group => group.permissions.map(p => p.id));
export const allPermissions = [...allPermissionIds] as const;
export type Permission = typeof allPermissions[number];
