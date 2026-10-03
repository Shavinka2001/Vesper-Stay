'use client';

import { Package } from 'lucide-react';
import { ComingSoon } from '@/components/dashboard/ComingSoon';

export default function InventoryPage() {
  return (
    <ComingSoon
      title="Inventory & Stock"
      description="Track F&B and supply stock levels with low-stock alerts for your property."
      icon={<Package className="h-6 w-6" />}
    />
  );
}
