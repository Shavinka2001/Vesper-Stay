import { Injectable } from '@nestjs/common';

export interface HealthPayload {
  status: 'ok';
  service: string;
  timestamp: string;
}

@Injectable()
export class AppService {
  getHealth(): HealthPayload {
    return {
      status: 'ok',
      service: 'vesperstay-api',
      timestamp: new Date().toISOString(),
    };
  }
}
