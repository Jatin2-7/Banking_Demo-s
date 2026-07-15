import React, { useRef } from 'react';
import { OPTIMO, FONTS, DASHBOARD_MAX_W } from '../theme.js';
import DashboardHeader from '../components/dashboard/DashboardHeader.jsx';
import DashboardHero from '../components/dashboard/DashboardHero.jsx';
import StatsBanner from '../components/dashboard/StatsBanner.jsx';
import ProductCards from '../components/dashboard/ProductCards.jsx';
import EmiCalculatorSection from '../components/dashboard/EmiCalculatorSection.jsx';
import GrowthJourneySection from '../components/dashboard/GrowthJourneySection.jsx';
import RbiFooter from '../components/dashboard/RbiFooter.jsx';
import FloatingSideTabs from '../components/dashboard/FloatingSideTabs.jsx';

export default function DashboardScreen({
  emiValues,
  onEmiChange,
  onNavigateLap,
  onCheckEligibility,
}) {
  const emiRef = useRef(null);

  const scrollToEmi = () => {
    emiRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleApplyFromEmi = () => {
    const prefill = {};
    if (emiValues.loanAmount) prefill.loanAmount = emiValues.loanAmount;
    onNavigateLap('lap', prefill);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: OPTIMO.bg, fontFamily: FONTS.body }}>
      <DashboardHeader
        onCheckEligibility={onCheckEligibility || scrollToEmi}
        onApplyLoan={() => onNavigateLap('lap')}
      />
      <FloatingSideTabs />

      <main
        className="mx-auto space-y-12 px-5 py-8 lg:space-y-14 lg:px-8 lg:py-10"
        style={{ maxWidth: DASHBOARD_MAX_W }}
      >
        <DashboardHero onApplyLoan={() => onNavigateLap('lap')} />
        <StatsBanner />
        <ProductCards onApply={(product) => onNavigateLap(product)} />
        <EmiCalculatorSection
          values={emiValues}
          onChange={onEmiChange}
          onApply={handleApplyFromEmi}
          onScrollRef={emiRef}
        />
        <GrowthJourneySection onContact={() => onNavigateLap('lap')} />
      </main>

      <RbiFooter />
    </div>
  );
}
