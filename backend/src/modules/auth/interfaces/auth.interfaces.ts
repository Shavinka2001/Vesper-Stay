import type { UserRole } from '@generated/prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  propertyId: string | null;
  role: UserRole | null;
  propertyIds: string[];
  roles: UserRole[];
}

export interface AuthUserView {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  globalRole: UserRole | null;
  roles: UserRole[];
  propertyIds: string[];
  isActive: boolean;
}

export interface AuthPropertyView {
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
  role: UserRole;
}

export interface AuthSuccessResponse {
  success: true;
  token: string;
  user: AuthUserView;
  property: AuthPropertyView | null;
}

export interface AuthMeResponse {
  success: true;
  user: AuthUserView;
  property: AuthPropertyView | null;
}
