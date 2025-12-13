import type { InventoryCategory, InventoryItem, Vendor } from '@/types';

export const mockInventoryCategories: InventoryCategory[] = [
  { id: 'CAT001', name: 'Housekeeping Supplies', description: 'Cleaning and room supplies', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'CAT002', name: 'Bathroom Amenities', description: 'Guest bathroom products', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'CAT003', name: 'Linens & Towels', description: 'Bed linens, towels, and fabrics', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'CAT004', name: 'F&B - Beverages', description: 'Drinks and beverages', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'CAT005', name: 'F&B - Food Items', description: 'Food and ingredients', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'CAT006', name: 'Maintenance', description: 'Tools and maintenance supplies', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'CAT007', name: 'Office Supplies', description: 'Stationery and office items', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'CAT008', name: 'Minibar', description: 'Minibar items', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
];

export const mockVendors: Vendor[] = [
  {
    id: 'VEN001',
    code: 'FS-001',
    name: 'FreshServe Supplies',
    contactPerson: 'Rahul Menon',
    email: 'orders@freshserve.com',
    phone: '+91-9876000001',
    address: { street: '123 Industrial Area', city: 'Mumbai', state: 'Maharashtra', postalCode: '400001', country: 'India' },
    paymentTerms: 'Net 30',
    leadTimeDays: 3,
    rating: 4.5,
    status: 'active',
    categories: ['F&B - Food Items', 'F&B - Beverages'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'VEN002',
    code: 'CL-001',
    name: 'Comfort Linen Co.',
    contactPerson: 'Priya Sharma',
    email: 'sales@comfortlinen.com',
    phone: '+91-9876000002',
    address: { street: '456 Textile Park', city: 'Ahmedabad', state: 'Gujarat', postalCode: '380001', country: 'India' },
    paymentTerms: 'Net 45',
    leadTimeDays: 7,
    rating: 4.8,
    status: 'active',
    categories: ['Linens & Towels'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'VEN003',
    code: 'HA-001',
    name: 'Hospitality Amenities Ltd',
    contactPerson: 'Anil Kumar',
    email: 'supply@hospitalityamenities.com',
    phone: '+91-9876000003',
    address: { street: '789 MIDC', city: 'Pune', state: 'Maharashtra', postalCode: '411001', country: 'India' },
    paymentTerms: 'Net 30',
    leadTimeDays: 5,
    rating: 4.2,
    status: 'active',
    categories: ['Bathroom Amenities', 'Housekeeping Supplies'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'VEN004',
    code: 'MT-001',
    name: 'Metro Tools & Hardware',
    contactPerson: 'Vijay Reddy',
    email: 'orders@metrotools.in',
    phone: '+91-9876000004',
    address: { street: '321 Hardware Lane', city: 'Hyderabad', state: 'Telangana', postalCode: '500001', country: 'India' },
    paymentTerms: 'Net 15',
    leadTimeDays: 2,
    rating: 4.0,
    status: 'active',
    categories: ['Maintenance'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'VEN005',
    code: 'PB-001',
    name: 'Premium Beverages Dist.',
    contactPerson: 'Suresh Nair',
    email: 'sales@premiumbev.com',
    phone: '+91-9876000005',
    address: { street: '555 Beverage Hub', city: 'Bangalore', state: 'Karnataka', postalCode: '560001', country: 'India' },
    paymentTerms: 'COD',
    leadTimeDays: 1,
    rating: 4.6,
    status: 'active',
    categories: ['F&B - Beverages', 'Minibar'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

export const mockInventoryItems: InventoryItem[] = [
  // Housekeeping Supplies
  { id: 'INV001', sku: 'HS-001', name: 'All-Purpose Cleaner (5L)', categoryId: 'CAT001', unit: 'piece', currentStock: 45, parLevel: 50, reorderPoint: 20, reorderQuantity: 30, unitCost: 450, preferredVendorId: 'VEN003', isPerishable: false, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-12-01T00:00:00Z' },
  { id: 'INV002', sku: 'HS-002', name: 'Glass Cleaner (1L)', categoryId: 'CAT001', unit: 'piece', currentStock: 38, parLevel: 40, reorderPoint: 15, reorderQuantity: 25, unitCost: 180, preferredVendorId: 'VEN003', isPerishable: false, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-12-01T00:00:00Z' },
  { id: 'INV003', sku: 'HS-003', name: 'Toilet Bowl Cleaner', categoryId: 'CAT001', unit: 'piece', currentStock: 55, parLevel: 60, reorderPoint: 25, reorderQuantity: 35, unitCost: 120, preferredVendorId: 'VEN003', isPerishable: false, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-12-01T00:00:00Z' },
  { id: 'INV004', sku: 'HS-004', name: 'Microfiber Cloth (Pack of 10)', categoryId: 'CAT001', unit: 'pack', currentStock: 22, parLevel: 30, reorderPoint: 10, reorderQuantity: 20, unitCost: 350, preferredVendorId: 'VEN003', isPerishable: false, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-12-01T00:00:00Z' },
  
  // Bathroom Amenities
  { id: 'INV005', sku: 'BA-001', name: 'Shampoo Bottle (30ml)', categoryId: 'CAT002', unit: 'piece', currentStock: 520, parLevel: 600, reorderPoint: 200, reorderQuantity: 400, unitCost: 15, preferredVendorId: 'VEN003', isPerishable: false, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-12-01T00:00:00Z' },
  { id: 'INV006', sku: 'BA-002', name: 'Conditioner Bottle (30ml)', categoryId: 'CAT002', unit: 'piece', currentStock: 480, parLevel: 600, reorderPoint: 200, reorderQuantity: 400, unitCost: 15, preferredVendorId: 'VEN003', isPerishable: false, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-12-01T00:00:00Z' },
  { id: 'INV007', sku: 'BA-003', name: 'Body Lotion (30ml)', categoryId: 'CAT002', unit: 'piece', currentStock: 350, parLevel: 600, reorderPoint: 200, reorderQuantity: 400, unitCost: 18, preferredVendorId: 'VEN003', isPerishable: false, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-12-01T00:00:00Z' },
  { id: 'INV008', sku: 'BA-004', name: 'Soap Bar (40g)', categoryId: 'CAT002', unit: 'piece', currentStock: 680, parLevel: 800, reorderPoint: 300, reorderQuantity: 500, unitCost: 12, preferredVendorId: 'VEN003', isPerishable: false, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-12-01T00:00:00Z' },
  { id: 'INV009', sku: 'BA-005', name: 'Dental Kit', categoryId: 'CAT002', unit: 'piece', currentStock: 420, parLevel: 500, reorderPoint: 150, reorderQuantity: 350, unitCost: 25, preferredVendorId: 'VEN003', isPerishable: false, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-12-01T00:00:00Z' },
  
  // Linens & Towels
  { id: 'INV010', sku: 'LT-001', name: 'Bath Towel (White)', categoryId: 'CAT003', unit: 'piece', currentStock: 280, parLevel: 350, reorderPoint: 100, reorderQuantity: 150, unitCost: 380, preferredVendorId: 'VEN002', isPerishable: false, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-12-01T00:00:00Z' },
  { id: 'INV011', sku: 'LT-002', name: 'Hand Towel (White)', categoryId: 'CAT003', unit: 'piece', currentStock: 320, parLevel: 400, reorderPoint: 120, reorderQuantity: 180, unitCost: 180, preferredVendorId: 'VEN002', isPerishable: false, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-12-01T00:00:00Z' },
  { id: 'INV012', sku: 'LT-003', name: 'Face Towel (White)', categoryId: 'CAT003', unit: 'piece', currentStock: 380, parLevel: 450, reorderPoint: 150, reorderQuantity: 200, unitCost: 95, preferredVendorId: 'VEN002', isPerishable: false, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-12-01T00:00:00Z' },
  { id: 'INV013', sku: 'LT-004', name: 'Bed Sheet King (White)', categoryId: 'CAT003', unit: 'piece', currentStock: 85, parLevel: 120, reorderPoint: 40, reorderQuantity: 60, unitCost: 850, preferredVendorId: 'VEN002', isPerishable: false, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-12-01T00:00:00Z' },
  { id: 'INV014', sku: 'LT-005', name: 'Pillow Cover (White)', categoryId: 'CAT003', unit: 'piece', currentStock: 240, parLevel: 300, reorderPoint: 100, reorderQuantity: 150, unitCost: 120, preferredVendorId: 'VEN002', isPerishable: false, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-12-01T00:00:00Z' },
  { id: 'INV015', sku: 'LT-006', name: 'Bathrobe', categoryId: 'CAT003', unit: 'piece', currentStock: 95, parLevel: 120, reorderPoint: 30, reorderQuantity: 50, unitCost: 650, preferredVendorId: 'VEN002', isPerishable: false, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-12-01T00:00:00Z' },
  
  // Beverages
  { id: 'INV016', sku: 'BV-001', name: 'Coffee Pods (Box of 50)', categoryId: 'CAT004', unit: 'box', currentStock: 18, parLevel: 40, reorderPoint: 15, reorderQuantity: 25, unitCost: 1200, preferredVendorId: 'VEN005', isPerishable: true, expiryAlertDays: 90, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-12-01T00:00:00Z' },
  { id: 'INV017', sku: 'BV-002', name: 'Tea Bags (Box of 100)', categoryId: 'CAT004', unit: 'box', currentStock: 25, parLevel: 35, reorderPoint: 12, reorderQuantity: 20, unitCost: 450, preferredVendorId: 'VEN001', isPerishable: true, expiryAlertDays: 180, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-12-01T00:00:00Z' },
  { id: 'INV018', sku: 'BV-003', name: 'Mineral Water 500ml (Case of 24)', categoryId: 'CAT004', unit: 'case', currentStock: 42, parLevel: 60, reorderPoint: 20, reorderQuantity: 40, unitCost: 240, preferredVendorId: 'VEN005', isPerishable: false, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-12-01T00:00:00Z' },
  { id: 'INV019', sku: 'BV-004', name: 'Fresh Orange Juice (1L)', categoryId: 'CAT004', unit: 'piece', currentStock: 35, parLevel: 50, reorderPoint: 15, reorderQuantity: 35, unitCost: 180, preferredVendorId: 'VEN001', isPerishable: true, expiryAlertDays: 7, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-12-01T00:00:00Z' },
  
  // Minibar
  { id: 'INV020', sku: 'MB-001', name: 'Coca Cola 330ml', categoryId: 'CAT008', unit: 'piece', currentStock: 180, parLevel: 250, reorderPoint: 80, reorderQuantity: 170, unitCost: 35, preferredVendorId: 'VEN005', isPerishable: false, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-12-01T00:00:00Z' },
  { id: 'INV021', sku: 'MB-002', name: 'Sprite 330ml', categoryId: 'CAT008', unit: 'piece', currentStock: 165, parLevel: 200, reorderPoint: 60, reorderQuantity: 140, unitCost: 35, preferredVendorId: 'VEN005', isPerishable: false, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-12-01T00:00:00Z' },
  { id: 'INV022', sku: 'MB-003', name: 'Beer - Kingfisher 330ml', categoryId: 'CAT008', unit: 'piece', currentStock: 95, parLevel: 150, reorderPoint: 50, reorderQuantity: 100, unitCost: 85, preferredVendorId: 'VEN005', isPerishable: false, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-12-01T00:00:00Z' },
  { id: 'INV023', sku: 'MB-004', name: 'Pringles Chips', categoryId: 'CAT008', unit: 'piece', currentStock: 88, parLevel: 120, reorderPoint: 40, reorderQuantity: 80, unitCost: 120, preferredVendorId: 'VEN001', isPerishable: true, expiryAlertDays: 60, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-12-01T00:00:00Z' },
  { id: 'INV024', sku: 'MB-005', name: 'Chocolate Bar', categoryId: 'CAT008', unit: 'piece', currentStock: 145, parLevel: 180, reorderPoint: 60, reorderQuantity: 120, unitCost: 65, preferredVendorId: 'VEN001', isPerishable: true, expiryAlertDays: 120, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-12-01T00:00:00Z' },
];

// Calculate low stock items
export const getLowStockItems = () => {
  return mockInventoryItems.filter(item => item.currentStock <= item.reorderPoint);
};
