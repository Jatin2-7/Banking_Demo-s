import React from 'react';
import KbHeader from './KbHeader.jsx';
import KbUpiBanner from './KbUpiBanner.jsx';
import KbProgressCard from './KbProgressCard.jsx';
import KbLoanCard from './KbLoanCard.jsx';
import { LOAN_PRODUCTS } from '../lib/navigation.js';

export default function KbDashboard({ progress, onOpenProduct, onOpenUpi }) {
  const products = [
    LOAN_PRODUCTS.personal,
    LOAN_PRODUCTS.business,
    LOAN_PRODUCTS.two_wheeler,
    LOAN_PRODUCTS.lap,
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-kb-page">
      <KbHeader />
      <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar pb-2">
        <KbUpiBanner onClick={onOpenUpi} />
        <KbProgressCard progress={progress} />
        {products.map((p) => (
          <KbLoanCard key={p.id} product={p} onAction={onOpenProduct} />
        ))}
      </div>
    </div>
  );
}
