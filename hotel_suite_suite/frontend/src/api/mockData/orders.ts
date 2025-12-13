import type { Order, OrderItem, MenuItem, Menu, OrderStatus, OrderType } from '@/types';
import { subtractDays } from '../helpers';

const today = new Date().toISOString().split('T')[0];
const now = new Date().toISOString();

export const mockMenuItems: MenuItem[] = [
  // Breakfast
  { id: 'MI001', name: 'Continental Breakfast', description: 'Fresh fruits, pastries, eggs any style, toast, juice, coffee', category: 'breakfast', price: 650, preparationTime: 20, isVegetarian: true, isVegan: false, isGlutenFree: false, isAvailable: true, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'MI002', name: 'Indian Breakfast', description: 'Poha, upma, idli, vada, sambar, chutney, filter coffee', category: 'breakfast', price: 450, preparationTime: 15, isVegetarian: true, isVegan: true, isGlutenFree: true, isAvailable: true, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'MI003', name: 'American Breakfast', description: 'Pancakes, bacon, sausage, hash browns, eggs, maple syrup', category: 'breakfast', price: 750, preparationTime: 25, isVegetarian: false, isVegan: false, isGlutenFree: false, isAvailable: true, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  
  // Appetizers
  { id: 'MI004', name: 'Caesar Salad', description: 'Romaine lettuce, parmesan, croutons, caesar dressing', category: 'appetizer', price: 350, preparationTime: 10, isVegetarian: true, isVegan: false, isGlutenFree: false, isAvailable: true, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'MI005', name: 'Paneer Tikka', description: 'Marinated cottage cheese grilled in tandoor', category: 'appetizer', price: 420, preparationTime: 20, isVegetarian: true, isVegan: false, isGlutenFree: true, isAvailable: true, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'MI006', name: 'Chicken Wings', description: 'Crispy fried wings with choice of sauce', category: 'appetizer', price: 480, preparationTime: 18, isVegetarian: false, isVegan: false, isGlutenFree: true, isAvailable: true, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  
  // Main Course
  { id: 'MI007', name: 'Butter Chicken', description: 'Tender chicken in creamy tomato sauce, served with naan', category: 'main_course', price: 550, preparationTime: 25, isVegetarian: false, isVegan: false, isGlutenFree: false, isAvailable: true, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'MI008', name: 'Dal Makhani', description: 'Creamy black lentils slow-cooked overnight', category: 'main_course', price: 380, preparationTime: 15, isVegetarian: true, isVegan: false, isGlutenFree: true, isAvailable: true, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'MI009', name: 'Grilled Salmon', description: 'Atlantic salmon with lemon butter sauce, vegetables', category: 'main_course', price: 950, preparationTime: 25, isVegetarian: false, isVegan: false, isGlutenFree: true, isAvailable: true, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'MI010', name: 'Margherita Pizza', description: 'Fresh tomato, mozzarella, basil on thin crust', category: 'main_course', price: 420, preparationTime: 20, isVegetarian: true, isVegan: false, isGlutenFree: false, isAvailable: true, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'MI011', name: 'Club Sandwich', description: 'Triple decker with chicken, bacon, egg, lettuce, tomato', category: 'main_course', price: 380, preparationTime: 15, isVegetarian: false, isVegan: false, isGlutenFree: false, isAvailable: true, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'MI012', name: 'Pasta Alfredo', description: 'Fettuccine in creamy parmesan sauce', category: 'main_course', price: 450, preparationTime: 18, isVegetarian: true, isVegan: false, isGlutenFree: false, isAvailable: true, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  
  // Desserts
  { id: 'MI013', name: 'Chocolate Brownie', description: 'Warm brownie with vanilla ice cream', category: 'dessert', price: 280, preparationTime: 8, isVegetarian: true, isVegan: false, isGlutenFree: false, isAvailable: true, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'MI014', name: 'Gulab Jamun', description: 'Traditional Indian sweet, served warm', category: 'dessert', price: 180, preparationTime: 5, isVegetarian: true, isVegan: false, isGlutenFree: false, isAvailable: true, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'MI015', name: 'Fresh Fruit Platter', description: 'Seasonal fruits artfully arranged', category: 'dessert', price: 320, preparationTime: 10, isVegetarian: true, isVegan: true, isGlutenFree: true, isAvailable: true, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  
  // Beverages
  { id: 'MI016', name: 'Fresh Lime Soda', description: 'Sweet or salted', category: 'beverage', price: 120, preparationTime: 3, isVegetarian: true, isVegan: true, isGlutenFree: true, isAvailable: true, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'MI017', name: 'Masala Chai', description: 'Traditional Indian spiced tea', category: 'beverage', price: 80, preparationTime: 5, isVegetarian: true, isVegan: false, isGlutenFree: true, isAvailable: true, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'MI018', name: 'Cappuccino', description: 'Italian espresso with steamed milk', category: 'beverage', price: 180, preparationTime: 5, isVegetarian: true, isVegan: false, isGlutenFree: true, isAvailable: true, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'MI019', name: 'Mango Lassi', description: 'Sweet yogurt drink with mango', category: 'beverage', price: 150, preparationTime: 5, isVegetarian: true, isVegan: false, isGlutenFree: true, isAvailable: true, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  
  // Alcohol
  { id: 'MI020', name: 'House Red Wine (Glass)', description: 'Selected red wine', category: 'alcohol', price: 450, preparationTime: 2, isVegetarian: true, isVegan: true, isGlutenFree: true, isAvailable: true, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'MI021', name: 'Kingfisher Beer', description: 'Chilled 650ml bottle', category: 'alcohol', price: 280, preparationTime: 2, isVegetarian: true, isVegan: true, isGlutenFree: false, isAvailable: true, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'MI022', name: 'Whisky (60ml)', description: 'Premium blended whisky', category: 'alcohol', price: 380, preparationTime: 2, isVegetarian: true, isVegan: true, isGlutenFree: true, isAvailable: true, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
];

export const mockMenus: Menu[] = [
  {
    id: 'MN001',
    name: 'Room Service Menu',
    description: '24-hour in-room dining menu',
    type: 'room_service',
    items: mockMenuItems,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'MN002',
    name: 'Breakfast Menu',
    description: 'Served 6:30 AM - 10:30 AM',
    type: 'breakfast',
    items: mockMenuItems.filter(m => m.category === 'breakfast' || m.category === 'beverage'),
    isActive: true,
    availableFrom: '06:30',
    availableTo: '10:30',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'MN003',
    name: 'All Day Dining',
    description: 'Available 11:00 AM - 11:00 PM',
    type: 'all_day',
    items: mockMenuItems.filter(m => m.category !== 'breakfast'),
    isActive: true,
    availableFrom: '11:00',
    availableTo: '23:00',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'MN004',
    name: 'Bar Menu',
    description: 'Lobby Bar - 5:00 PM - 1:00 AM',
    type: 'bar',
    items: mockMenuItems.filter(m => m.category === 'alcohol' || m.category === 'snack' || m.category === 'appetizer'),
    isActive: true,
    availableFrom: '17:00',
    availableTo: '01:00',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// Generate orders
export const mockOrders: Order[] = [];

const orderTypes: OrderType[] = ['room_service', 'room_service', 'room_service', 'restaurant', 'restaurant', 'bar', 'minibar'];
const orderStatuses: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'completed'];

// Today's orders
for (let i = 1; i <= 15; i++) {
  const type = orderTypes[Math.floor(Math.random() * orderTypes.length)];
  const status: OrderStatus = i <= 5 ? ['pending', 'confirmed', 'preparing'][Math.floor(Math.random() * 3)] as OrderStatus : 
                              i <= 10 ? ['ready', 'delivering', 'delivered'][Math.floor(Math.random() * 3)] as OrderStatus : 'completed';
  
  const numItems = Math.floor(Math.random() * 3) + 1;
  const items: OrderItem[] = [];
  let subtotal = 0;
  
  for (let j = 0; j < numItems; j++) {
    const menuItem = mockMenuItems[Math.floor(Math.random() * mockMenuItems.length)];
    const quantity = Math.floor(Math.random() * 2) + 1;
    const totalPrice = menuItem.price * quantity;
    subtotal += totalPrice;
    
    items.push({
      id: `OI${String(i).padStart(4, '0')}-${j + 1}`,
      menuItemId: menuItem.id,
      menuItem,
      name: menuItem.name,
      quantity,
      unitPrice: menuItem.price,
      totalPrice,
      status: status === 'completed' ? 'delivered' : status === 'delivered' ? 'delivered' : status === 'ready' ? 'ready' : 'pending',
    });
  }
  
  const taxAmount = Math.round(subtotal * 0.18);
  const serviceCharge = Math.round(subtotal * 0.05);
  
  mockOrders.push({
    id: `ORD${String(i).padStart(5, '0')}`,
    orderNumber: `ORD-${today.replace(/-/g, '')}-${String(i).padStart(4, '0')}`,
    type,
    status,
    guestId: `G${String(Math.floor(Math.random() * 10) + 1).padStart(3, '0')}`,
    roomId: type === 'room_service' || type === 'minibar' ? `RM${Math.floor(Math.random() * 8) + 1}${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}` : undefined,
    tableNumber: type === 'restaurant' ? `T${Math.floor(Math.random() * 20) + 1}` : type === 'bar' ? `B${Math.floor(Math.random() * 10) + 1}` : undefined,
    items,
    subtotal,
    taxAmount,
    serviceCharge,
    discount: 0,
    totalAmount: subtotal + taxAmount + serviceCharge,
    placedBy: 'EMP004',
    orderedAt: `${today}T${String(8 + Math.floor(Math.random() * 10)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00Z`,
    chargeToFolio: type === 'room_service' || type === 'minibar',
    paymentStatus: status === 'completed' ? 'charged' : 'pending',
    createdAt: `${today}T${String(8 + Math.floor(Math.random() * 10)).padStart(2, '0')}:00:00Z`,
    updatedAt: now,
  });
}

// Historical orders
for (let i = 16; i <= 80; i++) {
  const daysAgo = Math.floor(Math.random() * 14) + 1;
  const orderDate = subtractDays(today, daysAgo);
  const type = orderTypes[Math.floor(Math.random() * orderTypes.length)];
  
  const numItems = Math.floor(Math.random() * 4) + 1;
  const items: OrderItem[] = [];
  let subtotal = 0;
  
  for (let j = 0; j < numItems; j++) {
    const menuItem = mockMenuItems[Math.floor(Math.random() * mockMenuItems.length)];
    const quantity = Math.floor(Math.random() * 2) + 1;
    const totalPrice = menuItem.price * quantity;
    subtotal += totalPrice;
    
    items.push({
      id: `OI${String(i).padStart(4, '0')}-${j + 1}`,
      menuItemId: menuItem.id,
      menuItem,
      name: menuItem.name,
      quantity,
      unitPrice: menuItem.price,
      totalPrice,
      status: 'delivered',
    });
  }
  
  const taxAmount = Math.round(subtotal * 0.18);
  const serviceCharge = Math.round(subtotal * 0.05);
  
  mockOrders.push({
    id: `ORD${String(i).padStart(5, '0')}`,
    orderNumber: `ORD-${orderDate.replace(/-/g, '')}-${String(i).padStart(4, '0')}`,
    type,
    status: 'completed',
    guestId: `G${String(Math.floor(Math.random() * 50) + 1).padStart(3, '0')}`,
    roomId: type === 'room_service' || type === 'minibar' ? `RM${Math.floor(Math.random() * 8) + 1}${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}` : undefined,
    tableNumber: type === 'restaurant' ? `T${Math.floor(Math.random() * 20) + 1}` : type === 'bar' ? `B${Math.floor(Math.random() * 10) + 1}` : undefined,
    items,
    subtotal,
    taxAmount,
    serviceCharge,
    discount: 0,
    totalAmount: subtotal + taxAmount + serviceCharge,
    placedBy: 'EMP004',
    orderedAt: `${orderDate}T${String(8 + Math.floor(Math.random() * 12)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00Z`,
    deliveredAt: `${orderDate}T${String(9 + Math.floor(Math.random() * 12)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00Z`,
    chargeToFolio: type === 'room_service' || type === 'minibar',
    paymentStatus: 'charged',
    createdAt: `${orderDate}T08:00:00Z`,
    updatedAt: `${orderDate}T20:00:00Z`,
  });
}

// Helper functions
export const getTodaysOrders = () => mockOrders.filter(o => o.orderedAt.startsWith(today));
export const getPendingOrders = () => mockOrders.filter(o => ['pending', 'confirmed', 'preparing'].includes(o.status));
