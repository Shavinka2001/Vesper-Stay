import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';

export const PROPERTY_ID_HEADER = 'x-property-id';

export const PropertyId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<{
      propertyId?: string;
    }>();

    // Only ever return the scope that PropertyScopeGuard already resolved AND
    // authorized. We deliberately do NOT fall back to the raw x-property-id
    // header here: trusting it would let a handler that forgot the guard read an
    // unvetted, attacker-controlled tenant id. Fail closed instead.
    const propertyId = request.propertyId?.trim();

    if (!propertyId) {
      throw new BadRequestException(
        `Missing tenant scope. Ensure the route is protected by PropertyScopeGuard (it sets the authorized ${PROPERTY_ID_HEADER}).`,
      );
    }

    return propertyId;
  },
);
