import type { RequestUser } from '@common/interfaces/authenticated-request.interface';

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
      propertyId?: string;
    }
  }
}

export {};
