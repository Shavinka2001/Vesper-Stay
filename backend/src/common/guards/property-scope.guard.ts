import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole } from '@generated/prisma/client';
import { PROPERTY_ID_HEADER } from '@common/decorators/property-id.decorator';
import type { RequestUser } from '@common/interfaces/authenticated-request.interface';

/**
 * Enforces tenant isolation on every property-scoped request.
 *
 * MUST run AFTER JwtAuthGuard. By then `request.user` is the DB-sourced, freshly
 * resolved membership set (see AuthService.validateUserById), so `propertyIds`
 * is trustworthy server state — not something the caller can forge.
 *
 * Responsibilities:
 *   1. Resolve the requested propertyId (header → route param → user default).
 *   2. Prove the caller is actually a member of that property (authorization),
 *      allowing a platform SUPER_ADMIN to cross tenant boundaries.
 *   3. Pin the authorized id on `request.propertyId` so downstream code
 *      (the @PropertyId decorator, services) reads the vetted value and never
 *      re-trusts the raw, attacker-controlled `x-property-id` header.
 */
@Injectable()
export class PropertyScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      params: { propertyId?: string };
      propertyId?: string;
      user?: RequestUser;
    }>();

    const user = request.user;

    // Fail closed: this guard is meaningless without an authenticated user.
    // If JwtAuthGuard did not run (or did not populate the user), reject rather
    // than silently trusting the header.
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    const headerValue = request.headers[PROPERTY_ID_HEADER];
    const fromHeader = Array.isArray(headerValue)
      ? headerValue[0]
      : headerValue;
    const fromUser = user.propertyId ?? user.propertyIds?.[0] ?? null;

    const resolved =
      (typeof fromHeader === 'string' && fromHeader.trim()) ||
      request.params.propertyId ||
      fromUser ||
      null;

    if (!resolved || resolved.trim().length === 0) {
      throw new BadRequestException(
        `Missing tenant scope. Provide ${PROPERTY_ID_HEADER} header or propertyId route param.`,
      );
    }

    const requestedPropertyId = resolved.trim();

    // Authorization: the caller may only act within a property they belong to.
    // A platform-level SUPER_ADMIN is the single exception.
    const isPlatformAdmin = user.globalRole === UserRole.SUPER_ADMIN;
    const isMember = user.propertyIds.includes(requestedPropertyId);

    if (!isPlatformAdmin && !isMember) {
      // 403 Forbidden, and deliberately generic: we do not reveal whether the
      // property exists, so a caller cannot enumerate other tenants' ids.
      throw new ForbiddenException('You do not have access to this property');
    }

    // Pin the vetted scope for the rest of the request lifecycle.
    request.propertyId = requestedPropertyId;
    return true;
  }
}
