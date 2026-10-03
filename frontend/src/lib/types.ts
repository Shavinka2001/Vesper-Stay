export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  globalRole: string | null;
  roles: string[];
  propertyIds: string[];
  isActive: boolean;
};

export type AuthProperty = {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  currency: string;
  timezone: string;
  addressLine1: string | null;
  city: string | null;
  country: string | null;
  role: string;
};

export type AuthSuccessPayload = {
  success: true;
  token: string;
  user: AuthUser;
  property: AuthProperty | null;
};

export type AuthMePayload = {
  success: true;
  user: AuthUser;
  property: AuthProperty | null;
};

export type RegisterPropertyPayload = {
  propertyName: string;
  slug: string;
  email: string;
  phone?: string;
  address?: string;
  currency: string;
  timezone: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type ApiErrorBody = {
  success?: false;
  message?: string | string[];
  statusCode?: number;
};

export type ApiSuccessEnvelope<T> = {
  success: true;
  data: T;
  message?: string;
};

export type DashboardMetrics = {
  todaysArrivals: number;
  todaysDepartures: number;
  inHouseGuests: number;
  occupancyRate: number;
  todaysRevenue: number;
  occupiedRooms: number;
  totalRooms: number;
  asOf: string;
};

export type RoomStatusCount = {
  available: number;
  occupied: number;
  dirty: number;
  maintenance: number;
};

export type BookingSource =
  | 'DIRECT_WEB'
  | 'FRONT_DESK'
  | 'AIRBNB'
  | 'BOOKING_COM'
  | 'EXPEDIA'
  | 'PHONE'
  | 'OTHER'
  | 'DIRECT'
  | 'WALK_IN';

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'CANCELLED'
  | 'NO_SHOW';

export type RoomStatus =
  | 'AVAILABLE'
  | 'DIRTY'
  | 'OCCUPIED'
  | 'MAINTENANCE'
  | 'OUT_OF_ORDER'
  | 'CLEANING';

export type TapeRoom = {
  id: string;
  number: string;
  floor: string | null;
  status: RoomStatus | string;
  notes: string | null;
  isCabana: boolean;
  roomTypeId: string;
  roomTypeName: string;
  roomTypeCode: string;
  baseRate?: number;
};

export type RoomTypeGroup = {
  roomType: {
    id: string;
    name: string;
    code: string;
    description: string | null;
    maxOccupancy: number;
    baseRate: string | number;
    amenities: string[];
  };
  rooms: Array<{
    id: string;
    number: string;
    floor: string | null;
    status: string;
    notes: string | null;
    isCabana: boolean;
    roomTypeId: string;
  }>;
  roomCount: number;
  availableCount: number;
};

export type RoomTypeRecord = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  maxOccupancy: number;
  baseRate: string | number;
  amenities: string[];
  isActive: boolean;
  _count?: { rooms: number };
};

export type CreateRoomTypePayload = {
  name: string;
  description?: string;
  basePrice: number;
  maxAdults: number;
  maxChildren?: number;
  amenities?: string[];
};

export type UpdateRoomTypePayload = Partial<CreateRoomTypePayload> & {
  isActive?: boolean;
};

export type CreateRoomPayload = {
  roomTypeId: string;
  roomNumber: string;
  floor?: string;
  isCabana?: boolean;
  notes?: string;
};

export type PhysicalRoom = {
  id: string;
  number: string;
  floor: string | null;
  status: string;
  notes: string | null;
  isCabana: boolean;
  roomTypeId: string;
  roomTypeName: string;
  roomTypeCode: string;
};

export type TimelineBooking = {
  id: string;
  roomId: string;
  guestId: string;
  confirmationCode: string;
  status: BookingStatus | string;
  source: BookingSource | string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
  currency: string;
  totalAmount: string | number;
  paidAmount: string | number;
  notes: string | null;
  guest: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    idPassport?: string | null;
    nationality?: string | null;
    country?: string | null;
    vehicleNumber?: string | null;
  };
  room: {
    id: string;
    number: string;
    floor: string | null;
    status: string;
    isCabana: boolean;
    roomType?: { id: string; name: string; code: string } | null;
  };
};

export type CreateBookingPayload = {
  roomId: string;
  guest: {
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
    idPassport?: string;
    country?: string;
    nationality?: string;
  };
  checkInDate: string;
  checkOutDate: string;
  adultsCount: number;
  childrenCount?: number;
  totalAmount: number;
  paidAmount?: number;
  paymentMethod?: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'ONLINE';
  source: BookingSource;
  status?: 'CONFIRMED' | 'CHECKED_IN';
  specialRequests?: string;
  instantCheckIn?: boolean;
};

export type WhatsAppPayload = {
  message: string;
  waMeUrl: string | null;
  dispatched: boolean;
  channel: 'twilio' | 'meta' | 'wa_me' | 'none';
};

export type CreateBookingResult = {
  booking: TimelineBooking;
  whatsapp: WhatsAppPayload | null;
};

export type UpdateBookingStatusPayload = {
  status: 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';
};

export type GuestFolio = {
  bookingId: string;
  confirmationCode: string;
  currency: string;
  nights: number;
  baseRate: number;
  roomCharge: number;
  orderTotal: number;
  lines: Array<{
    id: string;
    kind: 'ROOM' | 'POS' | 'OTHER';
    label: string;
    amount: number;
  }>;
  grandTotal: number;
  paidAmount: number;
  balanceDue: number;
  payments: Array<{
    id: string;
    amount: number;
    method: string;
    status: string;
    paidAt: string | null;
    notes: string | null;
  }>;
  guest: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    idPassport: string | null;
    country: string | null;
    nationality: string | null;
    vehicleNumber: string | null;
  };
  room: {
    id: string;
    number: string;
    roomType?: { name: string; baseRate: string | number } | null;
  };
  status: string;
};

export type CheckInPayload = {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  idPassport?: string;
  country?: string;
  nationality?: string;
  vehicleNumber?: string;
  depositAmount?: number;
};

export type CheckOutPayload = {
  settleAmount?: number;
  paymentMethod?: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'ONLINE';
};

export type CheckInResult = {
  booking: TimelineBooking;
  whatsapp: WhatsAppPayload;
};

export type CheckOutResult = {
  booking: TimelineBooking;
  folio: GuestFolio;
  whatsapp: WhatsAppPayload;
};

export type PosPaymentMethod = 'CASH' | 'CARD' | 'CHARGE_TO_ROOM';

export type PosMenuItem = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  price: string | number;
  currency: string;
  isAvailable: boolean;
};

export type PosMenuCatalog = {
  categories: string[];
  items: PosMenuItem[];
  grouped: Array<{ category: string; items: PosMenuItem[] }>;
};

export type CreateMenuItemPayload = {
  name: string;
  category: string;
  price: number;
  isAvailable?: boolean;
  description?: string;
};

export type InHouseFolio = {
  bookingId: string;
  confirmationCode: string;
  roomId: string;
  roomNumber: string;
  guestName: string;
  label: string;
};

export type CreatePosOrderPayload = {
  items: Array<{
    menuItemId: string;
    quantity: number;
    unitPrice: number;
  }>;
  totalAmount: number;
  paymentMethod: PosPaymentMethod;
  bookingId?: string;
  roomNumber?: string;
  roomId?: string;
  notes?: string;
};

export type PosOrderResult = {
  id: string;
  subtotal: string | number;
  taxAmount: string | number;
  totalAmount: string | number;
  serviceCharge?: number;
  currency: string;
  paymentMethod: string | null;
  paymentLabel?: string;
  propertyName?: string;
  roomNumber?: string | null;
  notes: string | null;
  orderedAt: string;
  orderItems: Array<{
    id: string;
    quantity: number;
    unitPrice: string | number;
    lineTotal: string | number;
    menuItem: { id: string; name: string; category: string };
  }>;
  room?: { id: string; number: string } | null;
  guest?: { id: string; firstName: string; lastName: string } | null;
  booking?: { id: string; confirmationCode: string } | null;
};

export type PosOrdersToday = {
  date: string;
  orderCount: number;
  salesTotal: number;
  orders: PosOrderResult[];
};

export type StaffAssignableRole = 'MANAGER' | 'FRONT_DESK' | 'HOUSEKEEPING';

export type StaffRole =
  | 'SUPER_ADMIN'
  | 'HOTEL_OWNER'
  | StaffAssignableRole;

export type StaffMember = {
  id: string;
  membershipId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: StaffRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

export type CreateStaffPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  role: StaffAssignableRole;
};

export type UpdateStaffRolePayload = {
  role: StaffAssignableRole;
};

export type ResetStaffPasswordPayload = {
  password: string;
};

// ─── Channel Manager ─────────────────────────────────────────────────────────

export type ChannelType =
  | 'BOOKING_COM'
  | 'AIRBNB'
  | 'EXPEDIA'
  | 'ICAL'
  | 'OTHER';

export type ChannelSyncStatus = 'IDLE' | 'SYNCING' | 'SUCCESS' | 'FAILED';

export type ChannelSyncDirection = 'IMPORT' | 'EXPORT' | 'BIDIRECTIONAL';

export type ChannelSyncLog = {
  id: string;
  status: ChannelSyncStatus;
  direction: ChannelSyncDirection;
  startedAt: string;
  finishedAt: string | null;
  recordsProcessed: number;
  recordsFailed: number;
  errorMessage: string | null;
};

export type ChannelConnection = {
  id: string;
  channelType: ChannelType;
  name: string;
  roomId: string | null;
  isEnabled: boolean;
  iCalImportUrl: string | null;
  iCalExportUrl: string | null;
  syncDirection: ChannelSyncDirection;
  lastSyncedAt: string | null;
  lastSyncStatus: ChannelSyncStatus;
  lastSyncError: string | null;
  createdAt: string;
  room: { id: string; number: string } | null;
  syncLogs?: ChannelSyncLog[];
};

export type CreateChannelConnectionPayload = {
  channelType: ChannelType;
  name: string;
  roomId?: string;
  iCalImportUrl?: string;
  syncDirection?: ChannelSyncDirection;
  isEnabled?: boolean;
};

export type UpdateChannelConnectionPayload =
  Partial<CreateChannelConnectionPayload>;

export type ChannelSyncResult = {
  connectionId: string;
  imported: number;
  cancelled: number;
  failed: number;
  errors: string[];
};
