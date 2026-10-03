'use client';

import { Wallet } from 'lucide-react';
import { ComingSoon } from '@/components/dashboard/ComingSoon';

export default function ExpensesPage() {
  return (
    <ComingSoon
      title="Expenses & Cashflow"
      description="Record daily expenses and review property cashflow without leaving the console."
      icon={<Wallet className="h-6 w-6" />}
    />
  );
}
