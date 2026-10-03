import { Injectable } from '@nestjs/common';

export interface ChannelManagerStatus {
  propertyId: string;
  channels: unknown[];
  message: string;
}

@Injectable()
export class ChannelManagerService {
  getStatus(propertyId: string): Promise<ChannelManagerStatus> {
    // BullMQ workers will push Booking.com / Airbnb calendar sync here.
    return Promise.resolve({
      propertyId,
      channels: [],
      message: 'Channel manager scaffolding ready',
    });
  }
}
