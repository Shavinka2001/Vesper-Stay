'use client';

import { Radio } from 'lucide-react';
import { ComingSoon } from '@/components/dashboard/ComingSoon';

export default function ChannelsPage() {
  return (
    <ComingSoon
      title="Channel Manager"
      description="Sync Booking.com and Airbnb calendars with inventory and rate controls."
      icon={<Radio className="h-6 w-6" />}
    />
  );
}
