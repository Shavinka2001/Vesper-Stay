import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole } from '@generated/prisma/client';
import { PropertyScopeGuard } from '@common/guards/property-scope.guard';
import { PROPERTY_ID_HEADER } from '@common/decorators/property-id.decorator';
import type { RequestUser } from '@common/interfaces/authenticated-request.interface';

/**
 * Regression suite for the tenant-isolation fix.
 *
 * The guard's whole job is authorization: an authenticated caller may only
 * resolve a property scope they actually belong to (SUPER_ADMIN excepted).
 * These tests pin that contract so the IDOR can never silently come back.
 */

type FakeRequest = {
  headers: Record<string, string | string[] | undefined>;
  params: { propertyId?: string };
  propertyId?: string;
  user?: RequestUser;
};

function makeUser(overrides: Partial<RequestUser> = {}): RequestUser {
  return {
    id: 'user-1',
    email: 'owner@hotel-a.com',
    firstName: 'Ada',
    lastName: 'Owner',
    globalRole: null,
    propertyId: 'property-A',
    role: UserRole.HOTEL_OWNER,
    propertyIds: ['property-A'],
    roles: [UserRole.HOTEL_OWNER],
    isActive: true,
    ...overrides,
  };
}

function makeContext(request: FakeRequest): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({}),
      getNext: () => ({}),
    }),
  } as unknown as ExecutionContext;
}

describe('PropertyScopeGuard — tenant isolation', () => {
  let guard: PropertyScopeGuard;

  beforeEach(() => {
    guard = new PropertyScopeGuard();
  });

  it('Scenario 1: allows a member accessing their OWN property', () => {
    const request: FakeRequest = {
      headers: { [PROPERTY_ID_HEADER]: 'property-A' },
      params: {},
      user: makeUser(),
    };

    expect(guard.canActivate(makeContext(request))).toBe(true);
    // The vetted scope is pinned for downstream code.
    expect(request.propertyId).toBe('property-A');
  });

  it('Scenario 2: BLOCKS a member forging x-property-id for ANOTHER tenant', () => {
    const request: FakeRequest = {
      headers: { [PROPERTY_ID_HEADER]: 'property-B' }, // attacker-supplied
      params: {},
      user: makeUser(), // only a member of property-A
    };

    expect(() => guard.canActivate(makeContext(request))).toThrow(
      ForbiddenException,
    );
    // Critically, the attacker-supplied scope must NOT be pinned.
    expect(request.propertyId).toBeUndefined();
  });

  it('Scenario 4: SUPER_ADMIN may cross tenant boundaries', () => {
    const request: FakeRequest = {
      headers: { [PROPERTY_ID_HEADER]: 'property-Z' },
      params: {},
      user: makeUser({
        globalRole: UserRole.SUPER_ADMIN,
        propertyId: null,
        role: null,
        propertyIds: [], // not a member of anything, yet allowed
      }),
    };

    expect(guard.canActivate(makeContext(request))).toBe(true);
    expect(request.propertyId).toBe('property-Z');
  });

  it('falls back to the user default property when no header is sent', () => {
    const request: FakeRequest = {
      headers: {},
      params: {},
      user: makeUser(),
    };

    expect(guard.canActivate(makeContext(request))).toBe(true);
    expect(request.propertyId).toBe('property-A');
  });

  it('still blocks a forged scope passed via a route param', () => {
    const request: FakeRequest = {
      headers: {},
      params: { propertyId: 'property-B' },
      user: makeUser(),
    };

    expect(() => guard.canActivate(makeContext(request))).toThrow(
      ForbiddenException,
    );
  });

  it('fails closed with 401 when there is no authenticated user', () => {
    const request: FakeRequest = {
      headers: { [PROPERTY_ID_HEADER]: 'property-A' },
      params: {},
      user: undefined, // JwtAuthGuard did not run / populate the user
    };

    expect(() => guard.canActivate(makeContext(request))).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects with 400 when no scope can be resolved at all', () => {
    const request: FakeRequest = {
      headers: {},
      params: {},
      user: makeUser({ propertyId: null, propertyIds: [] }),
    };

    expect(() => guard.canActivate(makeContext(request))).toThrow(
      BadRequestException,
    );
  });
});
