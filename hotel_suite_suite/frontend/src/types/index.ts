// ============================================================
// HOTEL SUITE - UNIFIED TYPE DEFINITIONS
// ============================================================

// ============================================================
// COMMON TYPES
// ============================================================

export type ID = string;

export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

export interface AuditInfo extends Timestamps {
  createdBy: ID;
  updatedBy: ID;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============================================================
// CRS - CUSTOMER RESERVATION SYSTEM
// ============================================================

export type GuestVipStatus = 'none' | 'silver' | 'gold' | 'platinum';
export type GuestIdType = 'passport' | 'national_id' | 'driving_license' | 'other';

export interface Guest extends Timestamps {
  id: ID;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  dateOfBirth?: string;
  nationality?: string;
  address?: Address;
  idType?: GuestIdType;
  idNumber?: string;
  idExpiryDate?: string;
  vipStatus: GuestVipStatus;
  notes?: string;
  preferences?: GuestPreferences;
  totalStays: number;
  totalSpend: number;
  lastStayDate?: string;
  tags?: string[];
}

export interface Address {
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface GuestPreferences {
  roomType?: string;
  floorPreference?: 'high' | 'low' | 'any';
  bedType?: 'king' | 'queen' | 'twin';
  smokingRoom?: boolean;
  dietaryRestrictions?: string[];
  specialRequests?: string;
}

export type ReservationStatus = 
  | 'inquiry'
  | 'confirmed' 
  | 'checked_in' 
  | 'checked_out' 
  | 'cancelled' 
  | 'no_show';

export type ReservationSource = 
  | 'direct_website'
  | 'phone'
  | 'walk_in'
  | 'ota_booking'
  | 'ota_expedia'
  | 'ota_agoda'
  | 'corporate'
  | 'travel_agent'
  | 'group';

export type PaymentMode = 'prepaid' | 'pay_at_hotel' | 'corporate_billing';

export interface Reservation extends Timestamps {
  id: ID;
  confirmationNumber: string;
  guestId: ID;
  guest?: Guest;
  roomTypeId: ID;
  roomType?: RoomType;
  roomId?: ID;
  room?: Room;
  checkInDate: string;
  checkOutDate: string;
  actualCheckIn?: string;
  actualCheckOut?: string;
  nights: number;
  adults: number;
  children: number;
  infants: number;
  status: ReservationStatus;
  source: ReservationSource;
  rateCode?: string;
  roomRate: number;
  totalAmount: number;
  depositAmount: number;
  depositPaid: boolean;
  paymentMode: PaymentMode;
  specialRequests?: string;
  internalNotes?: string;
  folioId?: ID;
  cancelledAt?: string;
  cancellationReason?: string;
}

export interface ReservationGuest {
  reservationId: ID;
  guestId: ID;
  guest?: Guest;
  isPrimary: boolean;
}

// ============================================================
// RMS - ROOMS MANAGEMENT SYSTEM
// ============================================================

export type RoomStatus = 
  | 'available'
  | 'occupied'
  | 'reserved'
  | 'dirty'
  | 'cleaning'
  | 'inspecting'
  | 'out_of_order'
  | 'out_of_service';

export type RoomCondition = 'clean' | 'dirty' | 'inspected';

export interface RoomType extends Timestamps {
  id: ID;
  code: string;
  name: string;
  description: string;
  baseRate: number;
  maxOccupancy: number;
  maxAdults: number;
  maxChildren: number;
  bedType: string;
  bedCount: number;
  size: number; // square meters/feet
  amenities: string[];
  images: string[];
  isActive: boolean;
}

export interface Room extends Timestamps {
  id: ID;
  roomNumber: string;
  roomTypeId: ID;
  roomType?: RoomType;
  floor: number;
  building?: string;
  wing?: string;
  status: RoomStatus;
  condition: RoomCondition;
  isSmokingAllowed: boolean;
  hasBalcony: boolean;
  viewType?: string;
  currentGuestId?: ID;
  currentReservationId?: ID;
  lastCleanedAt?: string;
  lastInspectedAt?: string;
  notes?: string;
}

export type HousekeepingTaskStatus = 
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'verified'
  | 'skipped';

export type HousekeepingTaskType = 
  | 'checkout_clean'
  | 'stayover_clean'
  | 'deep_clean'
  | 'turndown'
  | 'inspection';

export type HousekeepingPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface HousekeepingTask extends Timestamps {
  id: ID;
  roomId: ID;
  room?: Room;
  type: HousekeepingTaskType;
  status: HousekeepingTaskStatus;
  priority: HousekeepingPriority;
  assignedTo?: ID;
  assignedEmployee?: Employee;
  scheduledDate: string;
  scheduledTime?: string;
  startedAt?: string;
  completedAt?: string;
  verifiedBy?: ID;
  verifiedAt?: string;
  notes?: string;
  issues?: string[];
  checklist?: HousekeepingChecklist[];
}

export interface HousekeepingChecklist {
  item: string;
  completed: boolean;
  notes?: string;
}

export type MaintenanceRequestStatus = 
  | 'reported'
  | 'acknowledged'
  | 'in_progress'
  | 'on_hold'
  | 'completed'
  | 'cancelled';

export type MaintenanceRequestPriority = 'low' | 'normal' | 'high' | 'emergency';

export type MaintenanceCategory = 
  | 'electrical'
  | 'plumbing'
  | 'hvac'
  | 'furniture'
  | 'appliance'
  | 'structural'
  | 'other';

export interface MaintenanceRequest extends Timestamps {
  id: ID;
  ticketNumber: string;
  roomId?: ID;
  room?: Room;
  location?: string;
  category: MaintenanceCategory;
  description: string;
  priority: MaintenanceRequestPriority;
  status: MaintenanceRequestStatus;
  reportedBy: ID;
  assignedTo?: ID;
  assignedEmployee?: Employee;
  estimatedCost?: number;
  actualCost?: number;
  startedAt?: string;
  completedAt?: string;
  resolution?: string;
  images?: string[];
}

// ============================================================
// IMS - INVENTORY MANAGEMENT SYSTEM
// ============================================================

export interface InventoryCategory extends Timestamps {
  id: ID;
  name: string;
  description?: string;
  parentCategoryId?: ID;
  isActive: boolean;
}

export type InventoryItemUnit = 
  | 'piece'
  | 'kg'
  | 'gram'
  | 'liter'
  | 'ml'
  | 'box'
  | 'pack'
  | 'case'
  | 'roll'
  | 'sheet';

export interface InventoryItem extends Timestamps {
  id: ID;
  sku: string;
  name: string;
  description?: string;
  categoryId: ID;
  category?: InventoryCategory;
  unit: InventoryItemUnit;
  currentStock: number;
  parLevel: number;
  reorderPoint: number;
  reorderQuantity: number;
  unitCost: number;
  lastPurchasePrice?: number;
  preferredVendorId?: ID;
  preferredVendor?: Vendor;
  location?: string;
  isPerishable: boolean;
  expiryAlertDays?: number;
  isActive: boolean;
}

export type StockMovementType = 
  | 'purchase'
  | 'consumption'
  | 'adjustment_add'
  | 'adjustment_remove'
  | 'transfer_in'
  | 'transfer_out'
  | 'waste'
  | 'return';

export interface StockMovement extends Timestamps {
  id: ID;
  itemId: ID;
  item?: InventoryItem;
  type: StockMovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  unitCost?: number;
  totalCost?: number;
  referenceType?: string;
  referenceId?: ID;
  notes?: string;
  performedBy: ID;
}

export interface StockAlert {
  id: ID;
  itemId: ID;
  item: InventoryItem;
  alertType: 'low_stock' | 'out_of_stock' | 'expiring_soon' | 'expired';
  alertDate: string;
  isResolved: boolean;
  resolvedAt?: string;
}

// ============================================================
// OMS - ORDER MANAGEMENT SYSTEM
// ============================================================

export type OrderType = 
  | 'room_service'
  | 'restaurant'
  | 'bar'
  | 'spa'
  | 'laundry'
  | 'minibar'
  | 'internal_requisition';

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'delivering'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export interface Order extends Timestamps {
  id: ID;
  orderNumber: string;
  type: OrderType;
  status: OrderStatus;
  guestId?: ID;
  guest?: Guest;
  reservationId?: ID;
  roomId?: ID;
  room?: Room;
  tableNumber?: string;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  serviceCharge: number;
  discount: number;
  totalAmount: number;
  specialInstructions?: string;
  placedBy: ID;
  preparedBy?: ID;
  deliveredBy?: ID;
  orderedAt: string;
  confirmedAt?: string;
  preparedAt?: string;
  deliveredAt?: string;
  chargeToFolio: boolean;
  folioId?: ID;
  paymentStatus: 'pending' | 'charged' | 'paid';
}

export interface OrderItem {
  id: ID;
  menuItemId: ID;
  menuItem?: MenuItem;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  modifiers?: string[];
  specialInstructions?: string;
  status: 'pending' | 'preparing' | 'ready' | 'delivered';
}

export type MenuItemCategory = 
  | 'appetizer'
  | 'main_course'
  | 'dessert'
  | 'beverage'
  | 'alcohol'
  | 'snack'
  | 'breakfast'
  | 'lunch'
  | 'dinner';

export interface MenuItem extends Timestamps {
  id: ID;
  name: string;
  description?: string;
  category: MenuItemCategory;
  price: number;
  cost?: number;
  preparationTime: number; // minutes
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  allergens?: string[];
  calories?: number;
  image?: string;
  isAvailable: boolean;
  isActive: boolean;
}

export interface Menu extends Timestamps {
  id: ID;
  name: string;
  description?: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'all_day' | 'bar' | 'room_service';
  items: MenuItem[];
  isActive: boolean;
  availableFrom?: string;
  availableTo?: string;
}

// ============================================================
// SMS - SUPPLY MANAGEMENT SYSTEM
// ============================================================

export type VendorStatus = 'active' | 'inactive' | 'blacklisted';

export interface Vendor extends Timestamps {
  id: ID;
  code: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  address: Address;
  taxId?: string;
  paymentTerms: string;
  leadTimeDays: number;
  rating?: number;
  status: VendorStatus;
  categories: string[];
  notes?: string;
  bankDetails?: BankDetails;
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
  ifscCode?: string;
  swiftCode?: string;
}

export type PurchaseOrderStatus = 
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'sent'
  | 'acknowledged'
  | 'partial_received'
  | 'received'
  | 'cancelled';

export interface PurchaseOrder extends Timestamps {
  id: ID;
  poNumber: string;
  vendorId: ID;
  vendor?: Vendor;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  totalAmount: number;
  currency: string;
  expectedDeliveryDate?: string;
  deliveryAddress?: string;
  notes?: string;
  createdBy: ID;
  approvedBy?: ID;
  approvedAt?: string;
  sentAt?: string;
}

export interface PurchaseOrderItem {
  id: ID;
  itemId: ID;
  item?: InventoryItem;
  description: string;
  quantity: number;
  receivedQuantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export type DeliveryStatus = 
  | 'scheduled'
  | 'in_transit'
  | 'arrived'
  | 'receiving'
  | 'completed'
  | 'rejected';

export interface Delivery extends Timestamps {
  id: ID;
  deliveryNumber: string;
  purchaseOrderId: ID;
  purchaseOrder?: PurchaseOrder;
  vendorId: ID;
  vendor?: Vendor;
  status: DeliveryStatus;
  scheduledDate: string;
  arrivedAt?: string;
  completedAt?: string;
  receivedBy?: ID;
  items: DeliveryItem[];
  invoiceNumber?: string;
  invoiceAmount?: number;
  notes?: string;
  issues?: string;
}

export interface DeliveryItem {
  id: ID;
  poItemId: ID;
  itemId: ID;
  item?: InventoryItem;
  orderedQuantity: number;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  rejectionReason?: string;
  batchNumber?: string;
  expiryDate?: string;
}

// ============================================================
// BMS - BILLING MANAGEMENT SYSTEM
// ============================================================

export type FolioStatus = 'open' | 'closed' | 'settled' | 'disputed';

export interface Folio extends Timestamps {
  id: ID;
  folioNumber: string;
  reservationId: ID;
  reservation?: Reservation;
  guestId: ID;
  guest?: Guest;
  roomId?: ID;
  room?: Room;
  status: FolioStatus;
  charges: FolioCharge[];
  payments: Payment[];
  totalCharges: number;
  totalPayments: number;
  balance: number;
  currency: string;
  closedAt?: string;
  notes?: string;
}

export type ChargeCategory = 
  | 'room'
  | 'food_beverage'
  | 'spa'
  | 'laundry'
  | 'minibar'
  | 'telephone'
  | 'parking'
  | 'other'
  | 'tax'
  | 'service_charge'
  | 'discount'
  | 'adjustment';

export interface FolioCharge extends Timestamps {
  id: ID;
  folioId: ID;
  category: ChargeCategory;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  referenceType?: string;
  referenceId?: ID;
  chargeDate: string;
  postedBy: ID;
  isVoided: boolean;
  voidedBy?: ID;
  voidedAt?: string;
  voidReason?: string;
}

export type PaymentMethod = 
  | 'cash'
  | 'credit_card'
  | 'debit_card'
  | 'upi'
  | 'bank_transfer'
  | 'corporate_account'
  | 'travel_agent'
  | 'voucher'
  | 'other';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'partial_refund';

export interface Payment extends Timestamps {
  id: ID;
  receiptNumber: string;
  folioId: ID;
  folio?: Folio;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  referenceNumber?: string;
  cardLastFour?: string;
  cardType?: string;
  notes?: string;
  processedBy: ID;
  processedAt: string;
  refundedAmount?: number;
  refundedAt?: string;
  refundReason?: string;
}

export type InvoiceStatus = 'draft' | 'issued' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface Invoice extends Timestamps {
  id: ID;
  invoiceNumber: string;
  folioId: ID;
  folio?: Folio;
  guestId: ID;
  guest?: Guest;
  companyName?: string;
  companyAddress?: Address;
  taxId?: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  currency: string;
  notes?: string;
}

export interface InvoiceItem {
  id: ID;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate?: number;
  taxAmount?: number;
}

// ============================================================
// AMS - ATTENDANCE MANAGEMENT SYSTEM
// ============================================================

export type EmployeeStatus = 'active' | 'on_leave' | 'suspended' | 'terminated';

export type Department = 
  | 'front_office'
  | 'housekeeping'
  | 'food_beverage'
  | 'kitchen'
  | 'engineering'
  | 'security'
  | 'spa'
  | 'sales'
  | 'finance'
  | 'hr'
  | 'it'
  | 'management';

export interface Employee extends Timestamps {
  id: ID;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  address?: Address;
  department: Department;
  designation: string;
  reportingTo?: ID;
  manager?: Employee;
  joiningDate: string;
  status: EmployeeStatus;
  employmentType: 'full_time' | 'part_time' | 'contract' | 'intern';
  salary?: number;
  bankDetails?: BankDetails;
  emergencyContact?: EmergencyContact;
  documents?: EmployeeDocument[];
  skills?: string[];
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface EmployeeDocument {
  type: string;
  number: string;
  issueDate?: string;
  expiryDate?: string;
  fileUrl?: string;
}

export type ShiftType = 'morning' | 'afternoon' | 'night' | 'split' | 'flexible';

export interface Shift extends Timestamps {
  id: ID;
  name: string;
  type: ShiftType;
  startTime: string;
  endTime: string;
  breakDuration: number; // minutes
  isActive: boolean;
}

export interface ShiftSchedule extends Timestamps {
  id: ID;
  employeeId: ID;
  employee?: Employee;
  shiftId: ID;
  shift?: Shift;
  date: string;
  isOvertime: boolean;
  notes?: string;
}

export type AttendanceStatus = 
  | 'present'
  | 'absent'
  | 'late'
  | 'half_day'
  | 'on_leave'
  | 'holiday'
  | 'weekend';

export interface AttendanceRecord extends Timestamps {
  id: ID;
  employeeId: ID;
  employee?: Employee;
  date: string;
  shiftId?: ID;
  shift?: Shift;
  status: AttendanceStatus;
  clockIn?: string;
  clockOut?: string;
  breakStart?: string;
  breakEnd?: string;
  totalHours?: number;
  overtimeHours?: number;
  lateMinutes?: number;
  earlyLeaveMinutes?: number;
  notes?: string;
}

export type LeaveType = 
  | 'annual'
  | 'sick'
  | 'personal'
  | 'maternity'
  | 'paternity'
  | 'bereavement'
  | 'unpaid';

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveRequest extends Timestamps {
  id: ID;
  employeeId: ID;
  employee?: Employee;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  approvedBy?: ID;
  approvedAt?: string;
  rejectionReason?: string;
  documents?: string[];
}

export interface LeaveBalance {
  employeeId: ID;
  year: number;
  leaveType: LeaveType;
  entitled: number;
  taken: number;
  pending: number;
  balance: number;
}

// ============================================================
// TMS - TASK MANAGEMENT SYSTEM
// ============================================================

export type TaskStatus = 
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'on_hold'
  | 'completed'
  | 'cancelled'
  | 'overdue';

export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';

export type TaskCategory = 
  | 'housekeeping'
  | 'maintenance'
  | 'guest_request'
  | 'internal'
  | 'event'
  | 'inspection'
  | 'delivery'
  | 'other';

export interface Task extends Timestamps {
  id: ID;
  taskNumber: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  assignedTo?: ID;
  assignedEmployee?: Employee;
  assignedDepartment?: Department;
  dueDate: string;
  dueTime?: string;
  estimatedMinutes?: number;
  actualMinutes?: number;
  roomId?: ID;
  room?: Room;
  guestId?: ID;
  guest?: Guest;
  reservationId?: ID;
  startedAt?: string;
  completedAt?: string;
  completedBy?: ID;
  verifiedBy?: ID;
  verifiedAt?: string;
  parentTaskId?: ID;
  subtasks?: Task[];
  attachments?: string[];
  comments?: TaskComment[];
  relatedModule?: string;
  relatedEntityId?: ID;
}

export interface TaskComment extends Timestamps {
  id: ID;
  taskId: ID;
  authorId: ID;
  author?: Employee;
  content: string;
  attachments?: string[];
}

export interface TaskTemplate extends Timestamps {
  id: ID;
  name: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  estimatedMinutes: number;
  assignToDepartment?: Department;
  checklist?: string[];
  isActive: boolean;
}

// ============================================================
// AS - ACCOUNTING SYSTEM
// ============================================================

export type AccountType = 
  | 'asset'
  | 'liability'
  | 'equity'
  | 'revenue'
  | 'expense';

export interface Account extends Timestamps {
  id: ID;
  code: string;
  name: string;
  type: AccountType;
  parentAccountId?: ID;
  parentAccount?: Account;
  description?: string;
  balance: number;
  currency: string;
  isActive: boolean;
  isSystemAccount: boolean;
}

export type TransactionType = 'debit' | 'credit';

export interface Transaction extends Timestamps {
  id: ID;
  transactionNumber: string;
  date: string;
  accountId: ID;
  account?: Account;
  type: TransactionType;
  amount: number;
  balance: number;
  description: string;
  referenceType?: string;
  referenceId?: ID;
  journalEntryId?: ID;
}

export type JournalEntryStatus = 'draft' | 'posted' | 'voided';

export interface JournalEntry extends Timestamps {
  id: ID;
  entryNumber: string;
  date: string;
  description: string;
  status: JournalEntryStatus;
  lines: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
  referenceType?: string;
  referenceId?: ID;
  postedBy?: ID;
  postedAt?: string;
  voidedBy?: ID;
  voidedAt?: string;
  voidReason?: string;
}

export interface JournalEntryLine {
  id: ID;
  accountId: ID;
  account?: Account;
  description?: string;
  debit: number;
  credit: number;
}

export type ReportType = 
  | 'profit_loss'
  | 'balance_sheet'
  | 'cash_flow'
  | 'trial_balance'
  | 'revenue_by_source'
  | 'expense_by_category'
  | 'occupancy'
  | 'adr'
  | 'revpar';

export interface FinancialReport {
  type: ReportType;
  startDate: string;
  endDate: string;
  generatedAt: string;
  data: Record<string, unknown>;
}

// ============================================================
// USER & AUTH
// ============================================================

export type UserRole = 
  | 'super_admin'
  | 'admin'
  | 'general_manager'
  | 'front_office_manager'
  | 'reservations_manager'
  | 'reception_supervisor'
  | 'receptionist'
  | 'housekeeping_manager'
  | 'housekeeper'
  | 'engineering_manager'
  | 'engineer'
  | 'fnb_manager'
  | 'fnb_staff'
  | 'chef'
  | 'inventory_manager'
  | 'procurement_manager'
  | 'finance_manager'
  | 'accountant'
  | 'hr_manager'
  | 'it_admin';

export interface User extends Timestamps {
  id: ID;
  username: string;
  email: string;
  employeeId?: ID;
  employee?: Employee;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: string;
  permissions?: string[];
}

// ============================================================
// NOTIFICATIONS
// ============================================================

export type NotificationType = 
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'task'
  | 'reservation'
  | 'payment'
  | 'inventory'
  | 'maintenance';

export interface Notification extends Timestamps {
  id: ID;
  userId: ID;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  readAt?: string;
}

// ============================================================
// DASHBOARD & ANALYTICS
// ============================================================

export interface DashboardMetrics {
  occupancyRate: number;
  averageDailyRate: number;
  revPar: number;
  totalRevenue: number;
  arrivalsToday: number;
  departuresToday: number;
  inHouseGuests: number;
  availableRooms: number;
  pendingTasks: number;
  openMaintenanceRequests: number;
  lowStockItems: number;
  pendingPayments: number;
}

export interface OccupancyData {
  date: string;
  occupiedRooms: number;
  totalRooms: number;
  occupancyRate: number;
}

export interface RevenueData {
  date: string;
  roomRevenue: number;
  fnbRevenue: number;
  otherRevenue: number;
  totalRevenue: number;
}
