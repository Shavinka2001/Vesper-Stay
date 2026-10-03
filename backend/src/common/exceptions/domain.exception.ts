import { HttpException, HttpStatus } from '@nestjs/common';

export class DomainException extends HttpException {
  constructor(
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(message, status);
  }
}

export class BookingConflictException extends DomainException {
  constructor(message = 'Room is already booked for these dates!') {
    super(message, HttpStatus.CONFLICT);
  }
}

export class TenantIsolationException extends DomainException {
  constructor(message = 'Resource does not belong to the active property') {
    super(message, HttpStatus.FORBIDDEN);
  }
}

export class ResourceNotFoundException extends DomainException {
  constructor(resource: string, id?: string) {
    const suffix = id ? ` (${id})` : '';
    super(`${resource} not found${suffix}`, HttpStatus.NOT_FOUND);
  }
}
