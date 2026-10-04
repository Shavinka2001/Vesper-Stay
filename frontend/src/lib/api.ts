import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type {
  ApiErrorBody,
  ApiSuccessEnvelope,
  AuthMePayload,
  AuthSuccessPayload,
  CreateBookingPayload,
  CreateBookingResult,
  CreateRoomPayload,
  CreateRoomTypePayload,
  DashboardMetrics,
  LoginPayload,
  PhysicalRoom,
  RegisterPropertyPayload,
  RoomStatusCount,
  RoomTypeGroup,
  RoomTypeRecord,
  TapeRoom,
  TimelineBooking,
  UpdateBookingStatusPayload,
  UpdateRoomTypePayload,
  CreateMenuItemPayload,
  CreatePosOrderPayload,
  CheckInPayload,
  CheckInResult,
  CheckOutPayload,
  CheckOutResult,
  GuestFolio,
  InHouseFolio,
  PosMenuCatalog,
  PosMenuItem,
  PosOrderResult,
  PosOrdersToday,
  CreateStaffPayload,
  ResetStaffPasswordPayload,
  StaffMember,
  UpdateStaffRolePayload,
  ChannelConnection,
  ChannelSyncResult,
  CreateChannelConnectionPayload,
  UpdateChannelConnectionPayload,
  WhatsAppConfig,
  UpdateWhatsAppConfigPayload,
} from '@/lib/types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30_000,
});

function readPersistedPropertyId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('vesperstay-auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      state?: { property?: { id?: string } | null };
    };
    return parsed.state?.property?.id ?? null;
  } catch {
    return null;
  }
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('vesperstay_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const propertyId = readPersistedPropertyId();
    if (propertyId) {
      config.headers['x-property-id'] = propertyId;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (!path.startsWith('/login') && !path.startsWith('/register')) {
        localStorage.removeItem('vesperstay_token');
        localStorage.removeItem('vesperstay-auth');
      }
    }
    return Promise.reject(error);
  },
);

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const raw = error.response?.data?.message;
    if (Array.isArray(raw)) return raw.join(', ');
    if (typeof raw === 'string' && raw.trim()) return raw;
    return error.message || fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

export async function loginRequest(
  payload: LoginPayload,
): Promise<AuthSuccessPayload> {
  const { data } = await api.post<AuthSuccessPayload>('/auth/login', payload);
  return data;
}

export async function registerPropertyRequest(
  payload: RegisterPropertyPayload,
): Promise<AuthSuccessPayload> {
  const { data } = await api.post<AuthSuccessPayload>(
    '/auth/register-property',
    payload,
  );
  return data;
}

export async function fetchMeRequest(): Promise<AuthMePayload> {
  const { data } = await api.get<AuthMePayload>('/auth/me');
  return data;
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const { data } =
    await api.get<ApiSuccessEnvelope<DashboardMetrics>>('/bookings/metrics');
  return data.data;
}

export async function fetchTimelineBookings(
  startDate: string,
  endDate: string,
): Promise<TimelineBooking[]> {
  const { data } = await api.get<ApiSuccessEnvelope<TimelineBooking[]>>(
    '/bookings/timeline',
    { params: { startDate, endDate } },
  );
  return data.data;
}

export async function fetchRoomStatusCounts(): Promise<RoomStatusCount> {
  const groups = await fetchRoomsGrouped();

  const counts: RoomStatusCount = {
    available: 0,
    occupied: 0,
    dirty: 0,
    maintenance: 0,
  };

  for (const group of groups) {
    for (const room of group.rooms) {
      if (room.status === 'AVAILABLE') counts.available += 1;
      else if (room.status === 'OCCUPIED') counts.occupied += 1;
      else if (room.status === 'DIRTY' || room.status === 'CLEANING')
        counts.dirty += 1;
      else if (room.status === 'MAINTENANCE') counts.maintenance += 1;
    }
  }

  return counts;
}

export async function fetchRoomsGrouped(): Promise<RoomTypeGroup[]> {
  const { data } =
    await api.get<ApiSuccessEnvelope<RoomTypeGroup[]>>('/rooms');
  return data.data;
}

export async function fetchTapeRooms(): Promise<TapeRoom[]> {
  const groups = await fetchRoomsGrouped();
  return groups.flatMap((group) =>
    group.rooms.map((room) => ({
      id: room.id,
      number: room.number,
      floor: room.floor,
      status: room.status,
      notes: room.notes,
      isCabana: room.isCabana,
      roomTypeId: group.roomType.id,
      roomTypeName: group.roomType.name,
      roomTypeCode: group.roomType.code,
      baseRate: Number(group.roomType.baseRate),
    })),
  );
}

export async function fetchPhysicalRooms(): Promise<PhysicalRoom[]> {
  const groups = await fetchRoomsGrouped();
  return groups.flatMap((group) =>
    group.rooms.map((room) => ({
      id: room.id,
      number: room.number,
      floor: room.floor,
      status: room.status,
      notes: room.notes,
      isCabana: room.isCabana,
      roomTypeId: group.roomType.id,
      roomTypeName: group.roomType.name,
      roomTypeCode: group.roomType.code,
    })),
  );
}

export async function fetchRoomTypes(): Promise<RoomTypeRecord[]> {
  const { data } =
    await api.get<ApiSuccessEnvelope<RoomTypeRecord[]>>('/rooms/types');
  return data.data;
}

export async function createRoomTypeRequest(
  payload: CreateRoomTypePayload,
): Promise<RoomTypeRecord> {
  const { data } = await api.post<ApiSuccessEnvelope<RoomTypeRecord>>(
    '/rooms/types',
    payload,
  );
  return data.data;
}

export async function updateRoomTypeRequest(
  id: string,
  payload: UpdateRoomTypePayload,
): Promise<RoomTypeRecord> {
  const { data } = await api.patch<ApiSuccessEnvelope<RoomTypeRecord>>(
    `/rooms/types/${id}`,
    payload,
  );
  return data.data;
}

export async function deleteRoomTypeRequest(id: string): Promise<void> {
  await api.delete(`/rooms/types/${id}`);
}

export async function createRoomRequest(
  payload: CreateRoomPayload,
): Promise<unknown> {
  const { data } = await api.post('/rooms', payload);
  return data;
}

export async function deleteRoomRequest(id: string): Promise<void> {
  await api.delete(`/rooms/${id}`);
}

export async function updateRoomStatusRequest(
  id: string,
  status: string,
): Promise<unknown> {
  const { data } = await api.patch(`/rooms/${id}/status`, { status });
  return data;
}

export async function createBookingRequest(
  payload: CreateBookingPayload,
): Promise<CreateBookingResult> {
  const bodyPayload: CreateBookingPayload = {
    roomId: payload.roomId,
    guest: {
      firstName: payload.guest.firstName.trim(),
      lastName: payload.guest.lastName.trim(),
      phone: payload.guest.phone?.trim() || undefined,
      email: payload.guest.email?.trim() || undefined,
      idPassport: payload.guest.idPassport?.trim() || undefined,
      country: payload.guest.country?.trim() || undefined,
      nationality: payload.guest.nationality?.trim() || undefined,
    },
    checkInDate: payload.checkInDate.slice(0, 10),
    checkOutDate: payload.checkOutDate.slice(0, 10),
    adultsCount: Number(payload.adultsCount) || 1,
    childrenCount: Number(payload.childrenCount ?? 0) || 0,
    totalAmount: Number(payload.totalAmount) || 0,
    paidAmount: Number(payload.paidAmount ?? 0) || 0,
    paymentMethod: payload.paymentMethod,
    source: payload.source,
    status: payload.status ?? (payload.instantCheckIn ? 'CHECKED_IN' : 'CONFIRMED'),
    specialRequests: payload.specialRequests?.trim() || undefined,
    instantCheckIn:
      payload.instantCheckIn === true || payload.status === 'CHECKED_IN',
  };

  const { data } = await api.post<
    ApiSuccessEnvelope<CreateBookingResult | TimelineBooking>
  >('/bookings', bodyPayload);
  const body = data.data;
  if (body && typeof body === 'object' && 'booking' in body) {
    return body as CreateBookingResult;
  }
  return { booking: body as TimelineBooking, whatsapp: null };
}

export async function updateBookingStatusRequest(
  bookingId: string,
  payload: UpdateBookingStatusPayload,
): Promise<TimelineBooking> {
  const { data } = await api.patch<ApiSuccessEnvelope<TimelineBooking>>(
    `/bookings/${bookingId}/status`,
    payload,
  );
  return data.data;
}

export async function fetchPosMenu(): Promise<PosMenuCatalog> {
  const { data } =
    await api.get<ApiSuccessEnvelope<PosMenuCatalog>>('/pos/menu');
  return data.data;
}

export async function createMenuItemRequest(
  payload: CreateMenuItemPayload,
): Promise<PosMenuItem> {
  const { data } = await api.post<ApiSuccessEnvelope<PosMenuItem>>(
    '/pos/menu',
    payload,
  );
  return data.data;
}

export async function fetchInHouseFolios(): Promise<InHouseFolio[]> {
  const { data } =
    await api.get<ApiSuccessEnvelope<InHouseFolio[]>>('/pos/in-house');
  return data.data;
}

export async function fetchPosOrdersToday(): Promise<PosOrdersToday> {
  const { data } =
    await api.get<ApiSuccessEnvelope<PosOrdersToday>>('/pos/orders');
  return data.data;
}

export async function createPosOrderRequest(
  payload: CreatePosOrderPayload,
): Promise<PosOrderResult> {
  const { data } = await api.post<ApiSuccessEnvelope<PosOrderResult>>(
    '/pos/orders',
    payload,
  );
  return data.data;
}

export async function fetchBookingsList(): Promise<TimelineBooking[]> {
  const { data } =
    await api.get<ApiSuccessEnvelope<TimelineBooking[]>>('/bookings');
  return data.data;
}

export async function fetchBookingFolio(
  bookingId: string,
): Promise<GuestFolio> {
  const { data } = await api.get<ApiSuccessEnvelope<GuestFolio>>(
    `/bookings/${bookingId}/folio`,
  );
  return data.data;
}

export async function checkInBookingRequest(
  bookingId: string,
  payload: CheckInPayload,
): Promise<CheckInResult> {
  const { data } = await api.post<ApiSuccessEnvelope<CheckInResult>>(
    `/bookings/${bookingId}/check-in`,
    payload,
  );
  return data.data;
}

export async function checkOutBookingRequest(
  bookingId: string,
  payload: CheckOutPayload = {},
): Promise<CheckOutResult> {
  const { data } = await api.post<ApiSuccessEnvelope<CheckOutResult>>(
    `/bookings/${bookingId}/check-out`,
    payload,
  );
  return data.data;
}

export async function fetchStaffMembers(): Promise<StaffMember[]> {
  const { data } =
    await api.get<ApiSuccessEnvelope<StaffMember[]>>('/staff');
  return data.data;
}

export async function createStaffMemberRequest(
  payload: CreateStaffPayload,
): Promise<StaffMember> {
  const { data } = await api.post<ApiSuccessEnvelope<StaffMember>>(
    '/staff',
    payload,
  );
  return data.data;
}

export async function toggleStaffStatusRequest(
  staffId: string,
  isActive: boolean,
): Promise<StaffMember> {
  const { data } = await api.patch<ApiSuccessEnvelope<StaffMember>>(
    `/staff/${staffId}/status`,
    { isActive },
  );
  return data.data;
}

export async function updateStaffRoleRequest(
  staffId: string,
  payload: UpdateStaffRolePayload,
): Promise<StaffMember> {
  const { data } = await api.patch<ApiSuccessEnvelope<StaffMember>>(
    `/staff/${staffId}/role`,
    payload,
  );
  return data.data;
}

export async function resetStaffPasswordRequest(
  staffId: string,
  payload: ResetStaffPasswordPayload,
): Promise<{ success: true }> {
  const { data } = await api.patch<ApiSuccessEnvelope<{ success: true }>>(
    `/staff/${staffId}/password`,
    payload,
  );
  return data.data;
}

export async function deleteStaffMemberRequest(
  staffId: string,
): Promise<{ success: true }> {
  const { data } = await api.delete<ApiSuccessEnvelope<{ success: true }>>(
    `/staff/${staffId}`,
  );
  return data.data;
}

// ─── Channel Manager ─────────────────────────────────────────────────────────

/** API origin without the trailing "/api" — used to build absolute iCal URLs. */
export function apiOrigin(): string {
  return API_BASE_URL.replace(/\/api\/?$/, '');
}

export async function fetchChannelConnections(): Promise<ChannelConnection[]> {
  const { data } = await api.get<ApiSuccessEnvelope<ChannelConnection[]>>(
    '/channel-manager/connections',
  );
  return data.data;
}

export async function createChannelConnectionRequest(
  payload: CreateChannelConnectionPayload,
): Promise<ChannelConnection> {
  const { data } = await api.post<ApiSuccessEnvelope<ChannelConnection>>(
    '/channel-manager/connections',
    payload,
  );
  return data.data;
}

export async function updateChannelConnectionRequest(
  id: string,
  payload: UpdateChannelConnectionPayload,
): Promise<ChannelConnection> {
  const { data } = await api.patch<ApiSuccessEnvelope<ChannelConnection>>(
    `/channel-manager/connections/${id}`,
    payload,
  );
  return data.data;
}

export async function deleteChannelConnectionRequest(
  id: string,
): Promise<{ success: true }> {
  const { data } = await api.delete<ApiSuccessEnvelope<{ success: true }>>(
    `/channel-manager/connections/${id}`,
  );
  return data.data;
}

export async function syncChannelConnectionRequest(
  id: string,
): Promise<ChannelSyncResult> {
  const { data } = await api.post<ApiSuccessEnvelope<ChannelSyncResult>>(
    `/channel-manager/connections/${id}/sync`,
    {},
  );
  return data.data;
}

// ─── WhatsApp config ─────────────────────────────────────────────────────────

export async function fetchWhatsAppConfig(): Promise<WhatsAppConfig> {
  const { data } = await api.get<ApiSuccessEnvelope<WhatsAppConfig>>(
    '/properties/whatsapp',
  );
  return data.data;
}

export async function updateWhatsAppConfigRequest(
  payload: UpdateWhatsAppConfigPayload,
): Promise<WhatsAppConfig> {
  const { data } = await api.patch<ApiSuccessEnvelope<WhatsAppConfig>>(
    '/properties/whatsapp',
    payload,
  );
  return data.data;
}
