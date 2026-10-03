import type { UserRole } from '@generated/prisma/client';

export interface RequestUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  globalRole: UserRole | null;
  /** Active / primary property for this session. */
  propertyId: string | null;
  /** Membership role on the primary property (if any). */
  role: UserRole | null;
  propertyIds: string[];
  roles: UserRole[];
  isActive: boolean;
}
