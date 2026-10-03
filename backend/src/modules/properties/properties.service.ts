import { Injectable } from '@nestjs/common';
import type { PaginationQueryDto } from '@common/dto/pagination-query.dto';

@Injectable()
export class PropertiesService {
  findAll(_query: PaginationQueryDto): Promise<unknown[]> {
    // Prisma queries will be property-/membership-scoped once Auth is wired.
    return Promise.resolve([]);
  }
}
