import React from 'react';
import AppLayout from '../components/AppLayout';
import SchwabInsights from './SchwabInsights';

export default function SchwabInsightsPage() {
  return (
    <AppLayout>
      <div className="app-page">
        <SchwabInsights />
      </div>
    </AppLayout>
  );
}
